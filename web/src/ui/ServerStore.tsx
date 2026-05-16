/**
 * Shared-state provider backed by the Genesys backend.
 *
 * Everything that needs to be visible to other cohort members — upvotes and
 * investments — lives here and is persisted on the server. Landing /
 * Leaderboard subscribe to this store; AppStore stays focused on per-browser
 * concerns (session, local drafts, the seed catalogue).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchState, postInvest, postUpvote, type ServerState, type ApiErrorCode } from '@/domain/api';
import { useStore } from './AppStore';

const POLL_MS = 15_000;

type InvestOutcome =
  | { ok: true; walletRemaining: number }
  | { ok: false; code: ApiErrorCode; message: string };

type UpvoteOutcome =
  | { ok: true; voted: boolean; count: number }
  | { ok: false; code: ApiErrorCode; message: string };

interface ServerCtx {
  state: ServerState;
  loading: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
  toggleUpvote: (startupId: string) => Promise<UpvoteOutcome>;
  invest: (startupId: string, amount: number) => Promise<InvestOutcome>;
  upvoteCount: (startupId: string) => number;
  hasVoted: (startupId: string) => boolean;
  totalInvestedBy: (handle: string) => number;
  walletRemaining: (handle: string) => number;
}

const Ctx = createContext<ServerCtx | null>(null);

const CREDITS_PER_INVESTOR = 100_000;

export function ServerStoreProvider({ children }: { children: ReactNode }) {
  const { state: appState } = useStore();
  const myHandle = appState.session?.handle ?? null;
  const myToken = appState.session?.accessToken ?? null;

  const [state, setState] = useState<ServerState>({ upvotes: {}, investments: [] });
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState();
      setState(s);
      setLastError(null);
    } catch (e: any) {
      setLastError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void refresh();
    const t = setInterval(() => { if (alive) void refresh(); }, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [refresh]);

  const toggleUpvote = useCallback(async (startupId: string): Promise<UpvoteOutcome> => {
    if (!myToken || !myHandle) {
      return { ok: false, code: 'NO_TOKEN', message: 'Sign in with GitHub to vote.' };
    }
    try {
      const r = await postUpvote(myToken, startupId);
      // Optimistic local update so the UI reflects the change immediately.
      setState((prev) => {
        const list = prev.upvotes[startupId] ?? [];
        const without = list.filter((h) => h.toLowerCase() !== myHandle.toLowerCase());
        const nextList = r.voted ? [...without, r.login] : without;
        return { ...prev, upvotes: { ...prev.upvotes, [startupId]: nextList } };
      });
      return { ok: true, voted: r.voted, count: r.count };
    } catch (e: any) {
      return { ok: false, code: (e?.code as ApiErrorCode) ?? 'NETWORK', message: String(e?.message ?? e) };
    }
  }, [myToken, myHandle]);

  const invest = useCallback(async (startupId: string, amount: number): Promise<InvestOutcome> => {
    if (!myToken || !myHandle) {
      return { ok: false, code: 'NO_TOKEN', message: 'Sign in with GitHub to invest.' };
    }
    try {
      const r = await postInvest(myToken, startupId, amount);
      setState((prev) => ({ ...prev, investments: [...prev.investments, r.investment] }));
      return { ok: true, walletRemaining: r.walletRemaining };
    } catch (e: any) {
      return { ok: false, code: (e?.code as ApiErrorCode) ?? 'NETWORK', message: String(e?.message ?? e) };
    }
  }, [myToken, myHandle]);

  const value: ServerCtx = useMemo(() => ({
    state,
    loading,
    lastError,
    refresh,
    toggleUpvote,
    invest,
    upvoteCount: (id) => (state.upvotes[id] ?? []).length,
    hasVoted: (id) => myHandle
      ? (state.upvotes[id] ?? []).some((h) => h.toLowerCase() === myHandle.toLowerCase())
      : false,
    totalInvestedBy: (handle) => state.investments
      .filter((i) => i.investorHandle.toLowerCase() === handle.toLowerCase())
      .reduce((a, b) => a + b.amount, 0),
    walletRemaining: (handle) => CREDITS_PER_INVESTOR - state.investments
      .filter((i) => i.investorHandle.toLowerCase() === handle.toLowerCase())
      .reduce((a, b) => a + b.amount, 0),
  }), [state, loading, lastError, refresh, toggleUpvote, invest, myHandle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Safe stub for tests / first paints outside the provider — returns an empty
// state and no-op mutators so consumers don't have to defend against null.
const stub: ServerCtx = {
  state: { upvotes: {}, investments: [] },
  loading: false,
  lastError: null,
  refresh: async () => {},
  toggleUpvote: async () => ({ ok: false, code: 'NO_TOKEN', message: 'Server store not mounted' }),
  invest: async () => ({ ok: false, code: 'NO_TOKEN', message: 'Server store not mounted' }),
  upvoteCount: () => 0,
  hasVoted: () => false,
  totalInvestedBy: () => 0,
  walletRemaining: () => CREDITS_PER_INVESTOR,
};

export function useServer(): ServerCtx {
  return useContext(Ctx) ?? stub;
}
