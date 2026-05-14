import { useState } from 'react';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { useStore } from '../AppStore';
import { Avatar } from '../components/Avatar';
import { GithubIcon, PlusIcon, ShieldIcon, XIcon } from '../design/Icon';
import type { ScoringWeights, SelfInvestPolicy } from '@/domain/types';
import { DEFAULT_WEIGHTS, validateWeights } from '@/domain/scoring';

const FIELDS: { key: keyof ScoringWeights; label: string; tone: string }[] = [
  { key: 'specCompleteness', label: 'Spec', tone: 'text-neon-400' },
  { key: 'testPassRate', label: 'Tests', tone: 'text-signal-green' },
  { key: 'techExecution', label: 'Tech', tone: 'text-signal-green' },
  { key: 'personaSatisfaction', label: 'Persona', tone: 'text-signal-violet' },
  { key: 'investorDemand', label: 'Demand', tone: 'text-signal-amber' },
  { key: 'marketPotential', label: 'Market', tone: 'text-sky-400' },
  { key: 'pitchScore', label: 'Pitch', tone: 'text-signal-amber' },
];

export function Admin() {
  const { state, addAllowlistHandle, removeAllowlistHandle, setSelfInvestPolicy, setCreditsPerInvestor, setWeights, reset } = useStore();
  const batch = state.batches.find((b) => b.id === state.activeBatchId)!;
  const [draftHandle, setDraftHandle] = useState('');
  const [weights, setLocalWeights] = useState<ScoringWeights>(batch.weights);
  const [creditsDraft, setCreditsDraft] = useState(batch.creditsPerInvestor);

  const w = validateWeights(weights);
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="admin console"
          title={`Batch · ${batch.name}`}
          right={<Chip tone="violet"><ShieldIcon size={12} /> admin</Chip>}
        />
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Single source of truth for the cohort: allowlist, policies, scoring weights.
          Changes apply immediately.
        </p>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento>
          <BentoHeader eyebrow="entry point" title="GitHub allowlist" right={<Chip tone="sky">{batch.allowlist.length}</Chip>} />
          <form
            onSubmit={(e) => { e.preventDefault(); if (draftHandle.trim()) { addAllowlistHandle(draftHandle); setDraftHandle(''); } }}
            className="mt-3 flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2">
              <GithubIcon size={14} className="text-white/40" />
              <input
                value={draftHandle}
                onChange={(e) => setDraftHandle(e.target.value)}
                placeholder="github-handle"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              />
            </div>
            <button className="neon-button !py-2 !px-3"><PlusIcon size={12} /> Add</button>
          </form>
          <ul className="mt-4 space-y-1.5">
            {batch.allowlist.map((h) => (
              <li key={h} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar seed={h} size={22} />
                  <span className="font-mono text-xs">@{h}</span>
                </div>
                <button onClick={() => removeAllowlistHandle(h)} className="text-white/50 hover:text-signal-red" title="Remove">
                  <XIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        </Bento>

        <Bento>
          <BentoHeader eyebrow="game" title="Credits & policy" />
          <div className="mt-3 space-y-3">
            <div>
              <div className="label">Credits per investor</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number" min={0} step={100}
                  value={creditsDraft}
                  onChange={(e) => setCreditsDraft(Number(e.target.value))}
                  className="w-32 rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
                />
                <button onClick={() => setCreditsPerInvestor(creditsDraft)} className="ghost-button !py-2">Save</button>
                <span className="text-xs text-white/40">currently <span className="text-neon-400 font-mono">{batch.creditsPerInvestor}</span></span>
              </div>
            </div>
            <div>
              <div className="label">Self-invest policy</div>
              <div className="mt-2 flex gap-2">
                {(['ALLOWED', 'LIMITED', 'FORBIDDEN'] as SelfInvestPolicy[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelfInvestPolicy(p)}
                    className={`chip ${batch.selfInvestPolicy === p ? 'chip-yellow' : 'chip-neutral'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/40">LIMITED caps self-invest at 10% of credits.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3 text-sm">
            <div className="display-mono">danger zone</div>
            <button onClick={reset} className="danger-button mt-2">Reset demo data</button>
          </div>
        </Bento>

        <Bento>
          <BentoHeader eyebrow="readiness" title="Scoring weights" right={<Chip tone={w.ok ? 'green' : 'red'}>sum {sum.toFixed(2)}</Chip>} />
          <div className="mt-3 space-y-3">
            {FIELDS.map((f) => (
              <div key={String(f.key)}>
                <div className="flex items-center justify-between">
                  <div className={`label ${f.tone}`}>{f.label}</div>
                  <span className="font-mono text-xs">{(weights[f.key] * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(weights[f.key] * 100)}
                  onChange={(e) => setLocalWeights({ ...weights, [f.key]: Number(e.target.value) / 100 })}
                  className="mt-1 w-full accent-[#F9F26B]"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between gap-2">
            <button onClick={() => setLocalWeights(DEFAULT_WEIGHTS)} className="ghost-button !py-2">Defaults</button>
            <button
              disabled={!w.ok}
              onClick={() => {
                const r = setWeights(weights);
                if (!r.ok) alert(r.reason);
              }}
              className={w.ok ? 'neon-button' : 'ghost-button opacity-50 cursor-not-allowed'}
            >
              Save
            </button>
          </div>
          {!w.ok ? <div className="mt-2 text-xs text-signal-red">{w.reason}</div> : null}
        </Bento>
      </div>
    </div>
  );
}
