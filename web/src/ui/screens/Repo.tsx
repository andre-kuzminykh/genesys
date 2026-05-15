import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useStartup, useStore } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { CheckIcon, GithubIcon, SparkleIcon, XIcon } from '../design/Icon';
import { scanRepo } from '@/domain/repoScan';
import { reposFor } from '@/data/mockRepos';

const PLAN = [
  { path: '/genesys/spec/product.md', size: '4kb' },
  { path: '/genesys/spec/features.md', size: '7kb' },
  { path: '/genesys/spec/user-stories.md', size: '9kb' },
  { path: '/genesys/spec/use-cases.md', size: '12kb' },
  { path: '/genesys/spec/requirements.md', size: '8kb' },
  { path: '/genesys/spec/traceability-matrix.md', size: '6kb' },
  { path: '/genesys/bdd/feat-gen-001.feature', size: '2kb' },
  { path: '/genesys/bdd/feat-gen-002.feature', size: '2kb' },
  { path: '/genesys/tests/test-gen-001.spec.ts', size: '1kb' },
  { path: '/genesys/tests/test-gen-002.spec.ts', size: '1kb' },
  { path: '/genesys/reports/health.json', size: '<1kb' },
];

export function Repo() {
  const { id } = useParams<{ id: string }>();
  const startup = useStartup(id);
  const { attachRepo, state } = useStore();
  const [val, setVal] = useState(startup?.repo ?? '');
  const [err, setErr] = useState<string | null>(null);

  // Try to find the attached repo within the owner's mock repos so we can scan it.
  const scanInfo = useMemo(() => {
    if (!startup?.repo || !startup.ownerHandle) return null;
    const all = reposFor(startup.ownerHandle);
    const mine = all.find((r) => r.fullName === startup.repo);
    return mine ? { repo: mine, result: scanRepo(mine) } : null;
  }, [startup?.repo, startup?.ownerHandle, state.startups]);

  if (!startup) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = attachRepo(startup.id, val);
    if (!r.ok) setErr(r.reason === 'INVALID_REPO' ? 'Use the form owner/repo (no slashes elsewhere).' : r.reason);
    else setErr(null);
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
              className="mt-2 w-full rounded-2xl border border-surfaceLight bg-base px-3 py-2.5 outline-none focus:border-neon-500/60"
            />
            {err ? <div className="mt-2 text-xs text-signal-red">{err}</div> : null}
          </div>
          <button className="neon-button" type="submit"><GithubIcon /> Attach</button>
        </form>
      </Bento>

      {/* FR-GEN-150 — live scan result of the attached repo */}
      <Bento>
        <BentoHeader
          eyebrow="repo scan · mock"
          title="What we found in your repo"
          right={
            scanInfo
              ? <Chip tone={scanInfo.result.kind === 'found' ? 'green' : scanInfo.result.kind === 'partial' ? 'amber' : 'red'}>
                  {scanInfo.result.kind.toUpperCase()}
                </Chip>
              : <Chip tone="neutral">no repo attached</Chip>
          }
        />
        {!scanInfo ? (
          <p className="mt-3 text-sm text-textsec">
            Attach a repo above to run the scan. In the demo, allowlisted users have several mock repos —
            try one of yours from <code className="font-mono">/onboarding/repo</code>.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <ScanCard
              ok={scanInfo.result.kind === 'found' || (scanInfo.result.kind === 'partial' && !!scanInfo.result.specPath)}
              label="/genesys/spec"
              subtitle={
                scanInfo.result.kind === 'found'
                  ? `≈ ${scanInfo.result.nodeCountHint} spec nodes detected`
                  : (scanInfo.result.kind === 'partial' && scanInfo.result.specPath)
                    ? 'spec directory present'
                    : 'no spec directory — generate via AI Analyst'
              }
            />
            <ScanCard
              ok={scanInfo.result.kind === 'found' || (scanInfo.result.kind === 'partial' && !!scanInfo.result.testsPath)}
              label="/genesys/tests"
              subtitle={
                scanInfo.result.kind === 'found'
                  ? 'tests directory present, BDD + unit files detected'
                  : (scanInfo.result.kind === 'partial' && scanInfo.result.testsPath)
                    ? 'tests directory present'
                    : 'no tests directory — derive from spec'
              }
            />
          </div>
        )}
      </Bento>

      <Bento>
        <BentoHeader
          eyebrow="file plan"
          title="What Genesys writes back to your repo"
          right={<Chip tone="sky">read/write mock · V1 uses GitHub API</Chip>}
        />
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLAN.map((p) => (
            <li key={p.path} className="flex items-center justify-between rounded-2xl border border-surfaceLight bg-base px-3 py-2 font-mono text-xs">
              <span className="truncate">{p.path}</span>
              <span className="text-textsec">{p.size}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-textsec">
          Claude Code / SuperAgent reads <code className="font-mono">/genesys/spec</code> and runs
          tests under <code className="font-mono">/genesys/tests</code>. The product reads back
          results to compute health and persona scores.
        </p>
      </Bento>
    </div>
  );
}

function ScanCard({ ok, label, subtitle }: { ok: boolean; label: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-surfaceLight bg-base p-4">
      <div className="flex items-center gap-2">
        {ok ? <CheckIcon className="text-signal-green" /> : <XIcon className="text-signal-amber" />}
        <code className="font-mono text-sm">{label}</code>
      </div>
      <div className="mt-1 text-xs text-textsec">{subtitle}</div>
    </div>
  );
}
