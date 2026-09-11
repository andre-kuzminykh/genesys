import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, ProductSpec, ScoringWeights, SelfInvestPolicy, SpecKind, SpecNode, Startup } from '@/domain/types';
import { loadState, persistState, resetState } from '@/data/store';
import { canLogin, addToAllowlist, removeFromAllowlist } from '@/domain/allowlist';
import { createNode, updateNode, deleteNode } from '@/domain/spec';
import { invest as investAction, remainingCredits } from '@/domain/investments';
import { createStartup as createStartupAction, attachRepo as attachRepoAction, publishStartup } from '@/domain/startup';
import { MockAiAnalyst } from '@/ai/analyst';
import { MockPersonaSimulator } from '@/ai/personas';
import { validateWeights } from '@/domain/scoring';
import { reposFor, REPO_TO_STARTUP } from '@/data/mockRepos';
import { scanRepo, type MockRepo, type RepoScanResult } from '@/domain/repoScan';
import { verifyToken } from '@/domain/github';

const analyst = new MockAiAnalyst();
const simulator = new MockPersonaSimulator();

type Ctx = {
  state: AppState;
  // session
  login: (handle: string) => { ok: true } | { ok: false; reason: 'NOT_ON_ALLOWLIST' };
  loginWithToken: (token: string) => Promise<
    | { ok: true; handle: string }
    | { ok: false; reason: 'BAD_TOKEN' | 'NOT_ON_ALLOWLIST' | 'NETWORK'; message?: string }
  >;
  logout: () => void;
  // batch admin
  addAllowlistHandle: (handle: string) => void;
  removeAllowlistHandle: (handle: string) => void;
  setWeights: (w: ScoringWeights) => { ok: true } | { ok: false; reason: string };
  setSelfInvestPolicy: (p: SelfInvestPolicy) => void;
  setCreditsPerInvestor: (n: number) => void;
  // startup
  createStartup: (args: { name: string; pitch: string; category: string; description?: string; hashtags?: string[]; landingUrl?: string; repo?: string }) =>
    | { ok: true; startupId: string }
    | { ok: false; reason: string };
  // onboarding / repo scan
  myRepos: () => MockRepo[];
  scanMyRepo: (fullName: string) => { repo: MockRepo; result: RepoScanResult } | null;
  importStartupFromRepo: (fullName: string) =>
    | { ok: true; startupId: string; alreadyExisted: boolean }
    | { ok: false; reason: string };
  attachRepo: (startupId: string, repo: string) => { ok: true } | { ok: false; reason: string };
  togglePublished: (startupId: string, value: boolean) => void;
  setAuxScores: (startupId: string, scores: { techExecution?: number; marketPotential?: number; pitchScore?: number }) => void;
  // spec
  runAnalystInterview: (startupId: string, input: { idea: string; category: string; targetUser?: string; problem?: string; solution?: string }) => void;
  addNode: (startupId: string, args: { kind: SpecKind; title: string; body?: string; parentIds?: string[] }) => SpecNode | null;
  editNode: (startupId: string, nodeId: string, patch: { title?: string; body?: string; reason?: string; links?: Partial<SpecNode['links']> }) => { ok: true } | { ok: false; reason: string };
  removeNode: (startupId: string, nodeId: string) => void;
  linkFrToTest: (startupId: string, frId: string, testId: string) => void;
  // investments
  invest: (startupId: string, amount: number) => { ok: true; remaining: number } | { ok: false; reason: string };
  // simulation
  runSimulation: (startupId: string) => { ok: true } | { ok: false; reason: string };
  // utilities
  reset: () => void;
  remaining: (handle: string) => number;
};

const StoreCtx = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    persistState(state);
  }, [state]);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState((s) => updater(s));
  }, []);

  const login = useCallback((handle: string): { ok: true } | { ok: false; reason: 'NOT_ON_ALLOWLIST' } => {
    const cur = ref.current;
    const batch = cur.batches.find((b) => b.id === cur.activeBatchId);
    if (!batch || !canLogin(handle, batch.allowlist)) return { ok: false, reason: 'NOT_ON_ALLOWLIST' };
    update((s) => ({ ...s, session: { handle: handle.trim().toLowerCase(), loggedInAt: Date.now() } }));
    return { ok: true };
  }, [update]);

  const logout = useCallback(() => update((s) => ({ ...s, session: null })), [update]);

  const loginWithToken = useCallback(async (token: string) => {
    const cur = ref.current;
    const batch = cur.batches.find((b) => b.id === cur.activeBatchId);
    if (!batch) return { ok: false as const, reason: 'NOT_ON_ALLOWLIST' as const };
    let user: { login: string; name: string | null; avatar_url: string };
    try {
      user = await verifyToken(token.trim());
    } catch (e: any) {
      if (e && typeof e === 'object' && 'status' in e) {
        return { ok: false as const, reason: 'BAD_TOKEN' as const, message: String(e.message ?? '') };
      }
      return { ok: false as const, reason: 'NETWORK' as const, message: String(e?.message ?? e) };
    }
    const handle = user.login.toLowerCase();
    if (!canLogin(handle, batch.allowlist)) {
      return { ok: false as const, reason: 'NOT_ON_ALLOWLIST' as const };
    }
    update((s) => ({
      ...s,
      session: {
        handle,
        loggedInAt: Date.now(),
        accessToken: token.trim(),
        name: user.name ?? undefined,
        avatarUrl: user.avatar_url,
      },
    }));
    return { ok: true as const, handle };
  }, [update]);

  const addAllowlistHandle = useCallback((h: string) => update((s) => ({
    ...s,
    batches: s.batches.map((b) => b.id === s.activeBatchId ? { ...b, allowlist: addToAllowlist(b.allowlist, h) } : b),
  })), [update]);

  const removeAllowlistHandle = useCallback((h: string) => update((s) => ({
    ...s,
    batches: s.batches.map((b) => b.id === s.activeBatchId ? { ...b, allowlist: removeFromAllowlist(b.allowlist, h) } : b),
  })), [update]);

  const setWeights = useCallback((w: ScoringWeights) => {
    const r = validateWeights(w);
    if (!r.ok) return r;
    update((s) => ({ ...s, batches: s.batches.map((b) => b.id === s.activeBatchId ? { ...b, weights: w } : b) }));
    return { ok: true } as const;
  }, [update]);

  const setSelfInvestPolicy = useCallback((p: SelfInvestPolicy) => update((s) => ({
    ...s, batches: s.batches.map((b) => b.id === s.activeBatchId ? { ...b, selfInvestPolicy: p } : b),
  })), [update]);

  const setCreditsPerInvestor = useCallback((n: number) => update((s) => ({
    ...s, batches: s.batches.map((b) => b.id === s.activeBatchId ? { ...b, creditsPerInvestor: Math.max(0, Math.floor(n)) } : b),
  })), [update]);

  const createStartup = useCallback((args: { name: string; pitch: string; category: string; description?: string }) => {
    const cur = ref.current;
    if (!cur.session) return { ok: false as const, reason: 'NO_SESSION' };
    const r = createStartupAction(cur, { batchId: cur.activeBatchId, ownerHandle: cur.session.handle, ...args });
    if (!r.ok) return r;
    const blankSpec: ProductSpec = {
      startupId: r.startup.id,
      nodes: [],
      architecture: { entities: [], components: [], dataFlow: [] },
    };
    setState({ ...r.state, specs: [...r.state.specs, blankSpec] });
    return { ok: true as const, startupId: r.startup.id };
  }, []);

  const attachRepo = useCallback((startupId: string, repo: string) => {
    const cur = ref.current;
    const r = attachRepoAction(cur, startupId, repo);
    if (!r.ok) return r;
    setState(r.state);
    return { ok: true as const };
  }, []);

  const togglePublished = useCallback((startupId: string, value: boolean) => {
    setState((s) => publishStartup(s, startupId, value));
  }, []);

  const setAuxScores = useCallback((startupId: string, scores: { techExecution?: number; marketPotential?: number; pitchScore?: number }) => {
    setState((s) => ({
      ...s,
      startups: s.startups.map((x) => x.id === startupId ? { ...x, ...scores } : x),
    }));
  }, []);

  const runAnalystInterview = useCallback((startupId: string, input: { idea: string; category: string; targetUser?: string; problem?: string; solution?: string }) => {
    setState((s) => {
      const draft = analyst.interview(input);
      let spec = s.specs.find((p) => p.startupId === startupId)
        ?? { startupId, nodes: [], architecture: { entities: [], components: [], dataFlow: [] } };
      const author = s.session?.handle;
      let t = Date.now();
      for (const n of draft.nodes) {
        spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: n.kind, title: n.title, body: n.body, author }, ++t)] };
      }
      // Auto-link FR → first TEST
      const firstTest = spec.nodes.find((n) => n.kind === 'TEST');
      if (firstTest) {
        spec = {
          ...spec,
          nodes: spec.nodes.map((n) =>
            n.kind === 'FR'
              ? { ...n, links: { ...n.links, tests: Array.from(new Set([...n.links.tests, firstTest.id])) } }
              : n,
          ),
        };
      }
      // Bump mode
      const startups = s.startups.map((x) => x.id === startupId ? { ...x, currentMode: 'MODE-2' as const } : x);
      const specs = s.specs.some((p) => p.startupId === startupId)
        ? s.specs.map((p) => p.startupId === startupId ? spec : p)
        : [...s.specs, spec];
      return { ...s, startups, specs };
    });
  }, []);

  const addNode = useCallback((startupId: string, args: { kind: SpecKind; title: string; body?: string; parentIds?: string[] }) => {
    let created: SpecNode | null = null;
    setState((s) => {
      const spec = s.specs.find((p) => p.startupId === startupId);
      if (!spec) return s;
      const n = createNode(spec, { ...args, author: s.session?.handle });
      created = n;
      return { ...s, specs: s.specs.map((p) => p.startupId === startupId ? { ...p, nodes: [...p.nodes, n] } : p) };
    });
    return created;
  }, []);

  const editNode = useCallback((startupId: string, nodeId: string, patch: { title?: string; body?: string; reason?: string; links?: Partial<SpecNode['links']> }): { ok: true } | { ok: false; reason: string } => {
    const cur = ref.current;
    const spec = cur.specs.find((p) => p.startupId === startupId);
    if (!spec) return { ok: false, reason: 'SPEC_NOT_FOUND' };
    const r = updateNode(spec, nodeId, { ...patch, author: cur.session?.handle });
    if (!r.ok) return r;
    setState((s) => ({ ...s, specs: s.specs.map((p) => p.startupId === startupId ? r.spec : p) }));
    return { ok: true };
  }, []);

  const removeNode = useCallback((startupId: string, nodeId: string) => {
    setState((s) => {
      const spec = s.specs.find((p) => p.startupId === startupId);
      if (!spec) return s;
      return { ...s, specs: s.specs.map((p) => p.startupId === startupId ? deleteNode(p, nodeId) : p) };
    });
  }, []);

  const linkFrToTest = useCallback((startupId: string, frId: string, testId: string) => {
    setState((s) => {
      const spec = s.specs.find((p) => p.startupId === startupId);
      if (!spec) return s;
      const node = spec.nodes.find((n) => n.id === frId);
      if (!node) return s;
      const next = Array.from(new Set([...node.links.tests, testId]));
      const r = updateNode(spec, frId, { links: { tests: next }, reason: 'link test' }, Date.now());
      if (!r.ok) return s;
      return { ...s, specs: s.specs.map((p) => p.startupId === startupId ? r.spec : p) };
    });
  }, []);

  const invest = useCallback((startupId: string, amount: number) => {
    const cur = ref.current;
    if (!cur.session) return { ok: false as const, reason: 'NO_SESSION' };
    const r = investAction(cur, { investorHandle: cur.session.handle, startupId, amount });
    if (!r.ok) return r;
    setState(r.state);
    return { ok: true as const, remaining: r.remainingCredits };
  }, []);

  const runSimulation = useCallback((startupId: string) => {
    const cur = ref.current;
    const startup = cur.startups.find((s) => s.id === startupId);
    const spec = cur.specs.find((p) => p.startupId === startupId);
    if (!startup || !spec) return { ok: false as const, reason: 'NOT_FOUND' };
    const out = simulator.simulate({ startup, spec, personas: ['impatient', 'technical', 'skeptical_investor', 'power_user', 'student', 'confused_first_time'] });
    if (!out.ok) return out;
    setState((s) => ({
      ...s,
      simulations: [
        ...s.simulations,
        { id: `SIM-${startupId}-${Date.now()}`, startupId, personas: ['impatient','technical','skeptical_investor','power_user','student','confused_first_time'], results: out.results, createdAt: Date.now() },
      ],
    }));
    return { ok: true as const };
  }, []);

  const remaining = useCallback((handle: string) => remainingCredits(ref.current, ref.current.activeBatchId, handle), []);

  const myRepos = useCallback((): MockRepo[] => {
    const h = ref.current.session?.handle;
    return h ? reposFor(h) : [];
  }, []);

  const scanMyRepo = useCallback((fullName: string): { repo: MockRepo; result: RepoScanResult } | null => {
    const r = myRepos().find((x) => x.fullName === fullName);
    if (!r) return null;
    return { repo: r, result: scanRepo(r) };
  }, [myRepos]);

  const importStartupFromRepo = useCallback((fullName: string) => {
    const session = ref.current.session;
    if (!session) return { ok: false as const, reason: 'NO_SESSION' };
    const found = reposFor(session.handle).find((x) => x.fullName === fullName);
    if (!found) return { ok: false as const, reason: 'REPO_NOT_FOUND' };

    // If we already have a startup mapped to this repo, return it (alreadyExisted=true).
    const mappedId = REPO_TO_STARTUP[fullName];
    if (mappedId) {
      const existing = ref.current.startups.find((s) => s.id === mappedId);
      if (existing && existing.ownerHandle === session.handle) {
        return { ok: true as const, startupId: existing.id, alreadyExisted: true };
      }
    }

    // Otherwise create a fresh startup pre-filled from repo metadata.
    const [, repoName] = found.fullName.split('/');
    const name = (repoName ?? found.fullName)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    const r = createStartupAction(ref.current, {
      batchId: ref.current.activeBatchId,
      ownerHandle: session.handle,
      name,
      pitch: `Imported from ${found.fullName}`,
      category: 'Imported',
      hashtags: ['imported', found.language.toLowerCase()],
      repo: found.fullName,
    });
    if (!r.ok) return r;
    const blankSpec: ProductSpec = {
      startupId: r.startup.id,
      nodes: [],
      architecture: { entities: [], components: [], dataFlow: [] },
    };
    setState({ ...r.state, specs: [...r.state.specs, blankSpec] });
    return { ok: true as const, startupId: r.startup.id, alreadyExisted: false };
  }, []);

  const reset = useCallback(() => setState(resetState()), []);

  const value: Ctx = useMemo(() => ({
    state,
    login, loginWithToken, logout,
    addAllowlistHandle, removeAllowlistHandle,
    setWeights, setSelfInvestPolicy, setCreditsPerInvestor,
    createStartup, attachRepo, togglePublished, setAuxScores,
    runAnalystInterview, addNode, editNode, removeNode, linkFrToTest,
    invest, runSimulation,
    myRepos, scanMyRepo, importStartupFromRepo,
    reset, remaining,
  }), [state, login, loginWithToken, logout, addAllowlistHandle, removeAllowlistHandle, setWeights, setSelfInvestPolicy, setCreditsPerInvestor, createStartup, attachRepo, togglePublished, setAuxScores, runAnalystInterview, addNode, editNode, removeNode, linkFrToTest, invest, runSimulation, myRepos, scanMyRepo, importStartupFromRepo, reset, remaining]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}

export function useStartup(id: string | undefined): Startup | undefined {
  const { state } = useStore();
  return state.startups.find((s) => s.id === id);
}

export function useSpec(startupId: string | undefined): ProductSpec | undefined {
  const { state } = useStore();
  return state.specs.find((p) => p.startupId === startupId);
}
