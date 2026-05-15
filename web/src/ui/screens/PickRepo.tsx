import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Wordmark } from '../components/Wordmark';
import { ArrowRightIcon, CheckIcon, GithubIcon, RocketIcon, XIcon } from '../design/Icon';
import { scanRepo, type MockRepo, type RepoScanResult } from '@/domain/repoScan';
import { listAndScan, type RealScan } from '@/domain/github';

type ScanRow = { fullName: string; language: string | null; stars: number; pushedDaysAgo: number; defaultBranch: string; isPrivate: boolean; scan: RepoScanResult };

function fromMock(r: MockRepo): ScanRow {
  return {
    fullName: r.fullName,
    language: r.language,
    stars: r.stars,
    pushedDaysAgo: r.pushedDaysAgo,
    defaultBranch: r.defaultBranch ?? 'main',
    isPrivate: false,
    scan: scanRepo(r),
  };
}

function fromReal(s: RealScan): ScanRow {
  let scan: RepoScanResult;
  if (s.hasSpec && s.hasTests) scan = { kind: 'found', specPath: '/genesys/spec', testsPath: '/genesys/tests', nodeCountHint: 0 };
  else if (s.hasSpec || s.hasTests) scan = { kind: 'partial', specPath: s.hasSpec ? '/genesys/spec' : null, testsPath: s.hasTests ? '/genesys/tests' : null };
  else scan = { kind: 'missing' };
  return {
    fullName: s.fullName,
    language: s.language,
    stars: s.stars,
    pushedDaysAgo: s.pushedDaysAgo,
    defaultBranch: s.defaultBranch,
    isPrivate: s.isPrivate,
    scan,
  };
}

export function PickRepo() {
  const { state, myRepos } = useStore();
  const nav = useNavigate();
  const me = state.session?.handle;
  const token = state.session?.accessToken;

  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mockRows = useMemo(() => myRepos().map(fromMock), [myRepos]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setRows(mockRows);
      return;
    }
    setRows(null);
    setErr(null);
    listAndScan(token, 20)
      .then((scans) => {
        if (!cancelled) setRows(scans.map(fromReal));
      })
      .catch((e: any) => {
        if (!cancelled) {
          setErr(String(e?.message ?? e));
          setRows([]);
        }
      });
    return () => { cancelled = true; };
  }, [token, mockRows]);

  const continueWith = (row: ScanRow) => {
    if (row.scan.kind === 'found') {
      nav('/coming-soon', { state: { flow: 'import', repo: row.fullName } });
    } else {
      const [, repoName] = row.fullName.split('/');
      const startupName = (repoName ?? row.fullName).replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      nav('/coming-soon', { state: { flow: 'scratch', repo: row.fullName, startupName } });
    }
  };

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home" className="shrink-0">
          <Wordmark size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-surfaceLight bg-surface px-3 py-1.5 text-sm">
            <GithubIcon size={14} className="text-textsec" />
            <span>signed in as <span className="font-mono text-neon-500">@{me}</span></span>
          </span>
          <Link to="/" className="ghost-button shrink-0"><XIcon size={12} /> Cancel</Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Pick a repository</h1>
        <p className="mt-3 text-textsec">
          {token
            ? <>Genesys is scanning your GitHub repos for <code className="font-mono text-neon-500">/genesys/spec</code> and <code className="font-mono text-neon-500">/genesys/tests</code>. Pick one to continue or start fresh.</>
            : <>Demo mode — repositories below are mocked because no GitHub token is attached to this session.</>}
        </p>

        {err ? (
          <div className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {err}
          </div>
        ) : null}

        {rows === null ? (
          <div className="mt-7 grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bento h-24 animate-pulse opacity-60" />
            ))}
            <div className="display-mono">scanning your repos…</div>
          </div>
        ) : (
          <ul className="mt-7 space-y-3">
            {rows.map((row) => (
              <RepoRow key={row.fullName} row={row} onPick={() => continueWith(row)} />
            ))}
            {rows.length === 0 ? (
              <li className="bento p-6 text-textsec">
                No repositories visible with this token / handle. <Link to="/" className="text-neon-500 underline">Back home</Link>.
              </li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}

function RepoRow({ row, onPick }: { row: ScanRow; onPick: () => void }) {
  return (
    <li className="bento p-5 transition hover:border-neon-500/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GithubIcon size={14} className="text-textsec" />
            <span className="font-mono text-base">{row.fullName}</span>
            {row.language ? (
              <span className="rounded-full border border-surfaceLight bg-base px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-textsec">
                {row.language}
              </span>
            ) : null}
            {row.isPrivate ? (
              <span className="rounded-full border border-surfaceLight bg-base px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-textsec">
                private
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-textsec">
            <span>★ {row.stars}</span>
            <span>· pushed {humanDays(row.pushedDaysAgo)}</span>
            <span>· branch {row.defaultBranch}</span>
          </div>
          <ScanLine scan={row.scan} />
        </div>

        <PickButton scan={row.scan} onClick={onPick} />
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
        <span className="text-xs text-textsec">at <code className="font-mono">{scan.specPath}</code></span>
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
        <span className="text-xs text-textsec">start from scratch — we'll fill the gap</span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Chip tone="amber"><XIcon size={10} /> no spec</Chip>
      <Chip tone="amber"><XIcon size={10} /> no tests</Chip>
      <span className="text-xs text-textsec">start from scratch — we'll bootstrap a fresh spec</span>
    </div>
  );
}

function PickButton({ scan, onClick }: { scan: RepoScanResult; onClick: () => void }) {
  if (scan.kind === 'found') {
    return (
      <button onClick={onClick} className="neon-button shrink-0">
        Open dashboard <ArrowRightIcon />
      </button>
    );
  }
  return (
    <button onClick={onClick} className="neon-button shrink-0">
      <RocketIcon /> Start from scratch
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
