import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { MagicWand } from '../components/MagicWand';
import { CheckIcon, RocketIcon } from '../design/Icon';
import {
  EMPTY_DRAFT, loadDraft, saveDraft, randomId,
  type BuildDraft, type FeaturePriority,
} from '@/data/buildDraft';
import {
  BuildAssistError,
  suggestFeatures, suggestMetrics, suggestProblem, suggestSolution, suggestUser,
} from '@/ai/buildAssist';

const PRIORITY_LABEL: Record<FeaturePriority, string> = {
  must: 'Must-have', should: 'Should-have', could: 'Could-have',
};
const PRIORITY_TONE: Record<FeaturePriority, string> = {
  must:  'border-neon-500/40 bg-neon-500/10 text-neon-500',
  should: 'border-softblue/40 bg-softblue/10 text-softblue',
  could: 'border-surfaceLight bg-surface text-textsec',
};

export function Build() {
  const nav = useNavigate();
  const [draft, setDraft] = useState<BuildDraft>(() => loadDraft());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { saveDraft(draft); }, [draft]);

  const update = useCallback((patch: (d: BuildDraft) => BuildDraft) => {
    setDraft((prev) => patch(prev));
  }, []);

  const wrapAssist = useCallback(async <T,>(key: string, fn: () => Promise<T>, apply: (v: T) => void) => {
    setBusy(key); setErr(null);
    try { apply(await fn()); }
    catch (e: any) {
      if (e instanceof BuildAssistError && e.code === 'NO_KEY') {
        setErr('OpenAI key not configured on the server (/opt/genesis/.env).');
      } else {
        setErr(String(e?.message ?? e));
      }
    } finally { setBusy(null); }
  }, []);

  const step1Done = draft.product.user.trim() && draft.product.problem.trim() && draft.product.solution.trim();
  const step2Done = draft.features.length > 0;
  const workingFeature = draft.features.find((f) => f.id === draft.workingFeatureId) ?? null;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home"><Wordmark size="xl" /></Link>
        <div className="flex items-center gap-2">
          <Link to="/" className="ghost-button">
            <span aria-hidden>←</span> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20">
        <section className="mt-2">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Build a new product from scratch
          </h1>
          <p className="mt-2 text-sm text-textsec">
            One step at a time. Magic wand pulls a suggestion from the LLM using everything you've filled in so far.
          </p>
        </section>

        {err ? (
          <div className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {err}
          </div>
        ) : null}

        {/* Step 1 — product foundation */}
        <StepShell index={1} title="Product foundation" done={!!step1Done}>
          <FieldRow
            label="Who is the user?"
            value={draft.product.user}
            placeholder='Indie illustrator monetising on Instagram who needs 5-10 finished pieces a week.'
            onChange={(v) => update((d) => ({ ...d, product: { ...d.product, user: v } }))}
            busy={busy === 'user'}
            onWand={() => wrapAssist('user', () => suggestUser(draft.product), (v) => update((d) => ({ ...d, product: { ...d.product, user: v } })))}
          />
          <FieldRow
            label="What problem do they have?"
            value={draft.product.problem}
            placeholder='Each illustration takes 5-10 hours. Most of that time is iteration on style consistency, not the actual idea.'
            multiline
            onChange={(v) => update((d) => ({ ...d, product: { ...d.product, problem: v } }))}
            busy={busy === 'problem'}
            onWand={() => wrapAssist('problem', () => suggestProblem(draft.product), (v) => update((d) => ({ ...d, product: { ...d.product, problem: v } })))}
          />
          <FieldRow
            label="What does your product do?"
            value={draft.product.solution}
            placeholder='Upload a rough sketch + a style pack; receive a polished, brand-coherent illustration in under a minute.'
            multiline
            onChange={(v) => update((d) => ({ ...d, product: { ...d.product, solution: v } }))}
            busy={busy === 'solution'}
            onWand={() => wrapAssist('solution', () => suggestSolution(draft.product), (v) => update((d) => ({ ...d, product: { ...d.product, solution: v } })))}
          />

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-sm font-extrabold">Key metrics</div>
              <MagicWand
                busy={busy === 'metrics'}
                onClick={() => wrapAssist('metrics', () => suggestMetrics(draft.product), (vs) => update((d) => ({ ...d, product: { ...d.product, metrics: vs.length ? vs : [''] } })))}
                title="Suggest 3 metrics"
              />
            </div>
            <div className="mt-2 space-y-2">
              {draft.product.metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-surface px-3 py-2">
                  <input
                    value={m}
                    onChange={(e) => update((d) => ({ ...d, product: { ...d.product, metrics: d.product.metrics.map((x, j) => (j === i ? e.target.value : x)) } }))}
                    placeholder="Median time-to-first-value < 60 s"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-textsec"
                  />
                  {draft.product.metrics.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => update((d) => ({ ...d, product: { ...d.product, metrics: d.product.metrics.filter((_, j) => j !== i) } }))}
                      className="text-xs text-textsec hover:text-danger"
                      aria-label="Remove metric"
                    >×</button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => update((d) => ({ ...d, product: { ...d.product, metrics: [...d.product.metrics, ''] } }))}
                className="text-xs font-bold uppercase tracking-wider text-textsec hover:text-neon-500"
              >+ Add metric</button>
            </div>
          </div>
        </StepShell>

        {/* Step 2 — feature roadmap */}
        <StepShell index={2} title="Feature roadmap" done={!!step2Done} locked={!step1Done}>
          <p className="text-sm text-textsec">
            Capture the must / should / could-have features. You'll only deep-dive ONE of them — the rest stay on
            the roadmap.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => update((d) => ({
                ...d,
                features: [...d.features, { id: randomId(), name: '', oneliner: '', priority: 'should' }],
              }))}
              className="rounded-full border border-surfaceLight bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-textsec hover:text-neon-500 hover:border-neon-500/40"
            >+ Add feature</button>
            <MagicWand
              busy={busy === 'features'}
              onClick={() => wrapAssist('features', () => suggestFeatures(draft.product), (vs) =>
                update((d) => ({ ...d, features: [...d.features, ...vs.map((f) => ({ id: randomId(), ...f }))] })))}
              title="Suggest 4-6 features based on the product brief"
            />
          </div>

          <ul className="mt-4 space-y-2">
            {draft.features.map((f) => (
              <li key={f.id} className={`rounded-2xl border ${f.id === draft.workingFeatureId ? 'border-neon-500/40' : 'border-surfaceLight'} bg-surface p-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={f.name}
                    onChange={(e) => update((d) => ({ ...d, features: d.features.map((x) => x.id === f.id ? { ...x, name: e.target.value } : x) }))}
                    placeholder="Feature name"
                    className="flex-1 min-w-[120px] bg-transparent outline-none font-display text-sm font-extrabold placeholder:text-textsec"
                  />
                  <select
                    value={f.priority}
                    onChange={(e) => update((d) => ({ ...d, features: d.features.map((x) => x.id === f.id ? { ...x, priority: e.target.value as FeaturePriority } : x) }))}
                    className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_TONE[f.priority]}`}
                  >
                    {(['must', 'should', 'could'] as FeaturePriority[]).map((p) => (
                      <option key={p} value={p} className="bg-base text-white">{PRIORITY_LABEL[p]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => update((d) => ({
                      ...d,
                      features: d.features.filter((x) => x.id !== f.id),
                      workingFeatureId: d.workingFeatureId === f.id ? null : d.workingFeatureId,
                    }))}
                    className="text-xs text-textsec hover:text-danger"
                    aria-label="Remove feature"
                  >×</button>
                </div>
                <input
                  value={f.oneliner}
                  onChange={(e) => update((d) => ({ ...d, features: d.features.map((x) => x.id === f.id ? { ...x, oneliner: e.target.value } : x) }))}
                  placeholder="One-liner — what the user can DO with it"
                  className="mt-2 w-full bg-transparent outline-none text-sm placeholder:text-textsec"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-textsec">{f.id}</span>
                  <button
                    type="button"
                    onClick={() => update((d) => ({ ...d, workingFeatureId: f.id }))}
                    className={`text-xs font-bold ${f.id === draft.workingFeatureId ? 'text-neon-500' : 'text-textsec hover:text-neon-500'}`}
                  >
                    {f.id === draft.workingFeatureId ? '✓ Working on this' : 'Pick to deep-dive →'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </StepShell>

        {/* Step 3 onwards — placeholder for the deep dive */}
        <StepShell index={3} title={`Deep-dive — ${workingFeature?.name || 'pick a feature first'}`} done={false} locked={!workingFeature}>
          <p className="text-sm text-textsec">
            The user-story → user-flow → BDD use-cases → FR/NFR pass for{' '}
            {workingFeature ? <strong className="text-neon-500">{workingFeature.name}</strong> : 'a feature'} lands here in the next iteration.
            For now your draft is saved locally — pick it up later.
          </p>
        </StepShell>

        <div className="mt-10 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => { if (confirm('Clear the entire draft and start over?')) { setDraft({ ...EMPTY_DRAFT }); } }}
            className="text-xs font-bold uppercase tracking-wider text-textsec hover:text-danger"
          >
            Reset draft
          </button>
          <button
            type="button"
            onClick={() => nav('/')}
            className="neon-button"
          >
            <CheckIcon size={14} /> Save & exit
          </button>
        </div>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}

function StepShell({ index, title, done, locked = false, children }: {
  index: number; title: string; done: boolean; locked?: boolean; children: React.ReactNode;
}) {
  return (
    <section className={`mt-8 rounded-3xl border ${done ? 'border-neon-500/30' : 'border-surfaceLight'} bg-surface p-6 ${locked ? 'opacity-50 pointer-events-none' : ''}`}>
      <header className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-full font-display font-extrabold ${done ? 'bg-neon-500 text-ink' : 'bg-surfaceLight text-textsec'}`}>
          {done ? <CheckIcon size={16} /> : index}
        </span>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldRow({
  label, value, placeholder, multiline, onChange, onWand, busy,
}: {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  onWand: () => void;
  busy?: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between">
        <label className="font-display text-sm font-extrabold">{label}</label>
        <MagicWand busy={!!busy} onClick={onWand} />
      </div>
      <div className="mt-2 rounded-2xl border border-surfaceLight bg-base focus-within:border-neon-500/60">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-textsec"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-textsec"
          />
        )}
      </div>
    </div>
  );
}
