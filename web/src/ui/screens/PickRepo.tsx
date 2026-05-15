import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { ArrowRightIcon, CheckIcon, GithubIcon, SparkleIcon, XIcon } from '../design/Icon';
import { scanRepo, type MockRepo, type RepoScanResult } from '@/domain/repoScan';

export function PickRepo() {
  const { state, myRepos, importStartupFromRepo } = useStore();
  const nav = useNavigate();
  const repos = myRepos();
  const me = state.session?.handle;

  const scans = useMemo(
    () => repos.map((r) => ({ repo: r, scan: scanRepo(r) })),
    [repos],
  );

  const start = (fullName: string, scan: RepoScanResult) => {
    const r = importStartupFromRepo(fullName);
    if (!r.ok) { alert(r.reason); return; }
    if (scan.kind === 'found') {
      nav(`/app/startups/${r.startupId}/spec`);
    } else {
      nav(`/app/startups/${r.startupId}/interview`);
    }
  };

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500 text-base font-display text-lg font-extrabold">
            G
          </div>
          <div className="font-display font-bold">Genesys</div>
        </div>
        <Link to="/" className="ghost-button"><XIcon size={12} /> Cancel</Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-6">
        <Chip tone="sky"><GithubIcon size={12} /> signed in as @{me}</Chip>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Pick a repository</h1>
        <p className="mt-3 text-textsec">
          We'll scan it for <code className="font-mono text-neon-500">/genesys/spec</code> and
          <code className="font-mono text-neon-500"> /genesys/tests</code>. If found, the dashboard
          imports them; otherwise we'll generate a fresh spec via the AI Analyst.
        </p>

        <ul className="mt-7 space-y-3">
          {scans.map(({ repo, scan }) => (
            <RepoRow key={repo.fullName} repo={repo} scan={scan} onStart={() => start(repo.fullName, scan)} />
          ))}
          {scans.length === 0 ? (
            <li className="bento p-6 text-textsec">
              No repositories on this account yet. <Link to="/app/new" className="text-neon-500 underline">Skip — create from scratch</Link>.
            </li>
          ) : null}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="display-mono">
            tip: any handle on the allowlist has demo repos. real GitHub OAuth ships in V1.
          </div>
          <Link to="/app/new" className="ghost-button">
            <SparkleIcon size={12} /> Skip — create from scratch
          </Link>
        </div>
      </section>
    </div>
  );
}

function RepoRow({
  repo,
  scan,
  onStart,
}: {
  repo: MockRepo;
  scan: RepoScanResult;
  onStart: () => void;
}) {
  return (
    <li className="bento p-5 transition hover:border-neon-500/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GithubIcon size={14} className="text-textsec" />
            <span className="font-mono text-base">{repo.fullName}</span>
            <span className="rounded-full border border-surfaceLight bg-base px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-textsec">
              {repo.language}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-textsec">
            <span>★ {repo.stars}</span>
            <span>· pushed {humanDays(repo.pushedDaysAgo)}</span>
            <span>· branch {repo.defaultBranch ?? 'main'}</span>
          </div>
          <ScanLine scan={scan} />
        </div>

        <ActionButton scan={scan} onClick={onStart} />
      </div>
    </li>
  );
}

function ScanLine({ scan }: { scan: RepoScanResult }) {
  if (scan.kind === 'found') {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip tone="green"><CheckIcon size={10} /> spec found</Chip>
        <Chip tone="green"><CheckIcon size={10} /> tests found</Chip>
        <span className="text-xs text-textsec">≈ {scan.nodeCountHint} spec nodes detected at <code className="font-mono">{scan.specPath}</code></span>
      </div>
    );
  }
  if (scan.kind === 'partial') {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip tone={scan.specPath ? 'green' : 'amber'}>
          {scan.specPath ? <CheckIcon size={10} /> : <XIcon size={10} />} spec
        </Chip>
        <Chip tone={scan.testsPath ? 'green' : 'amber'}>
          {scan.testsPath ? <CheckIcon size={10} /> : <XIcon size={10} />} tests
        </Chip>
        <span className="text-xs text-textsec">we'll fill the gap via the AI Analyst</span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Chip tone="amber"><XIcon size={10} /> no spec</Chip>
      <Chip tone="amber"><XIcon size={10} /> no tests</Chip>
      <span className="text-xs text-textsec">we'll generate a fresh spec via the AI Analyst</span>
    </div>
  );
}

function ActionButton({ scan, onClick }: { scan: RepoScanResult; onClick: () => void }) {
  if (scan.kind === 'found') {
    return (
      <button onClick={onClick} className="neon-button shrink-0">
        Import spec <ArrowRightIcon />
      </button>
    );
  }
  return (
    <button onClick={onClick} className="sky-button shrink-0">
      Generate spec <ArrowRightIcon />
    </button>
  );
}

function humanDays(d: number): string {
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  const m = Math.round(d / 30);
  return `${m} month${m > 1 ? 's' : ''} ago`;
}
