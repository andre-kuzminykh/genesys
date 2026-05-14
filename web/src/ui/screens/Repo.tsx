import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useStartup, useStore } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { GithubIcon } from '../design/Icon';

const PLAN = [
  { path: '/genesis/spec/product.md', size: '4kb' },
  { path: '/genesis/spec/features.md', size: '7kb' },
  { path: '/genesis/spec/user-stories.md', size: '9kb' },
  { path: '/genesis/spec/use-cases.md', size: '12kb' },
  { path: '/genesis/spec/requirements.md', size: '8kb' },
  { path: '/genesis/spec/traceability-matrix.md', size: '6kb' },
  { path: '/genesis/bdd/feat-gen-001.feature', size: '2kb' },
  { path: '/genesis/bdd/feat-gen-002.feature', size: '2kb' },
  { path: '/genesis/tests/test-gen-001.spec.ts', size: '1kb' },
  { path: '/genesis/tests/test-gen-002.spec.ts', size: '1kb' },
  { path: '/genesis/reports/health.json', size: '<1kb' },
];

export function Repo() {
  const { id } = useParams<{ id: string }>();
  const startup = useStartup(id);
  const { attachRepo } = useStore();
  const [val, setVal] = useState(startup?.repo ?? '');
  const [err, setErr] = useState<string | null>(null);

  if (!startup) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = attachRepo(startup.id, val);
    if (!r.ok) {
      setErr(r.reason === 'INVALID_REPO' ? 'Use the form owner/repo (no slashes elsewhere).' : r.reason);
    } else setErr(null);
  };

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="github integration"
          title="Repository"
          right={<Chip tone={startup.repo ? 'green' : 'neutral'}><GithubIcon size={12} /> {startup.repo ?? 'not attached'}</Chip>}
        />
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[260px]">
            <div className="label">Repository</div>
            <input
              value={val}
              onChange={(e) => { setVal(e.target.value); setErr(null); }}
              placeholder="owner/repo"
              className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2.5 outline-none focus:border-neon-500/60"
            />
            {err ? <div className="mt-2 text-xs text-signal-red">{err}</div> : null}
          </div>
          <button className="neon-button" type="submit"><GithubIcon /> Attach</button>
        </form>
      </Bento>

      <Bento>
        <BentoHeader
          eyebrow="file plan"
          title="What Genesys writes back to your repo"
          right={<Chip tone="sky">read/write mock · V1 uses GitHub API</Chip>}
        />
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLAN.map((p) => (
            <li key={p.path} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-ink-800/60 px-3 py-2 font-mono text-xs">
              <span className="truncate">{p.path}</span>
              <span className="text-white/40">{p.size}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-white/50">
          Claude Code / SuperAgent reads <code className="font-mono">/genesis/spec</code> and runs
          tests under <code className="font-mono">/genesis/tests</code>. The product reads back
          results to compute health and persona scores.
        </p>
      </Bento>
    </div>
  );
}
