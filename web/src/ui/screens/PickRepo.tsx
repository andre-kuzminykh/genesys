import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { ScrollToTop } from '../components/ScrollToTop';
import { Wordmark } from '../components/Wordmark';
import { ArrowRightIcon, CheckIcon, ExternalLinkIcon, GithubIcon, RocketIcon, XIcon } from '../design/Icon';
import { scanRepo, type MockRepo, type RepoScanResult } from '@/domain/repoScan';
import { listAndScan, type RealScan } from '@/domain/github';

type ScanRow = { fullName: string; language: string | null; stars: number; pushedDaysAgo: number; defaultBranch: string; isPrivate: boolean; scan: RepoScanResult };

const PAGE_SIZE = 15;

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
  const { state, myRepos, logout } = useStore();
  const nav = useNavigate();
  const me = state.session?.handle;
  const token = state.session?.accessToken;

  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibleRepos, setVisibleRepos] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleRepos(PAGE_SIZE); }, [query]);

  const mockRows = useMemo(() => myRepos().map(fromMock), [myRepos]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setRows(mockRows);
      return;
    }
    setRows(null);
    setErr(null);
    // Up to 100 repos via paged listing (owner + collaborator + org-member),
    // scan top 50 most-recently-pushed. Anything beyond is listed but not scanned.
    listAndScan(token, 100, 50)
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

  const filteredRows = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.fullName.toLowerCase().includes(q) || (r.language ?? '').toLowerCase().includes(q));
  }, [rows, query]);

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
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home" className="shrink-0">
          <Wordmark size="xl" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-surfaceLight bg-surface px-3 py-1.5 text-sm">
            <GithubIcon size={14} className="text-textsec" />
            <span>signed in as <span className="font-mono text-neon-500">@{me}</span></span>
          </span>
          <button
            type="button"
            onClick={() => { logout(); nav('/'); }}
            title={`Sign out @${me}`}
            aria-label={`Sign out @${me}`}
            className="inline-flex items-center gap-2 rounded-full border border-surfaceLight bg-surface px-3 py-1.5 text-sm transition hover:border-danger/40 hover:text-danger"
          >
            <XIcon size={12} className="text-textsec" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-6">
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
            <div className="display-mono">listing + scanning your repos…</div>
          </div>
        ) : (
          <>
            {/* Search box — full width of the rows below it. */}
            {rows.length > 5 ? (
              <div className="mt-7 flex w-full items-center gap-2 rounded-2xl border border-surfaceLight bg-surface px-4 py-2.5 focus-within:border-neon-500/60">
                <SearchIcon />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search owner/repo or language…"
                  className="flex-1 bg-transparent outline-none placeholder:text-textsec font-mono text-sm"
                  spellCheck={false}
                />
                {query ? (
                  <button onClick={() => setQuery('')} className="text-textsec hover:text-white" aria-label="Clear">
                    <XIcon size={12} />
                  </button>
                ) : null}
              </div>
            ) : null}

            <ul className="mt-5 space-y-3">
              {filteredRows!.slice(0, visibleRepos).map((row) => (
                <RepoRow key={row.fullName} row={row} onPick={() => continueWith(row)} />
              ))}
              {filteredRows!.length === 0 ? (
                <li className="bento p-6 text-textsec">
                  {rows.length === 0
                    ? <>No repositories visible with this token / handle. <Link to="/" className="text-neon-500 underline">Back home</Link>.</>
                    : <>No repositories match "{query}". Clear the filter or pick from the {rows.length} available.</>}
                </li>
              ) : null}
            </ul>

            {filteredRows!.length > visibleRepos ? (
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => setVisibleRepos((n) => n + PAGE_SIZE)}
                  className="ghost-button"
                  type="button"
                >
                  Load more · {filteredRows!.length - visibleRepos} hidden
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
      <ScrollToTop />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-textsec">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function RepoRow({ row, onPick }: { row: ScanRow; onPick: () => void }) {
  return (
    <li className="bento p-4 transition hover:border-neon-500/30">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GithubIcon size={14} className="text-textsec" />
            <a
              href={`https://github.com/${row.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-base hover:text-neon-500 transition"
            >
              {row.fullName}
              <ExternalLinkIcon size={12} className="text-textsec" />
            </a>
          </div>
          <div className="mt-2">
            <ScanChips scan={row.scan} />
          </div>
        </div>
        <PickButton scan={row.scan} onClick={onPick} />
      </div>
    </li>
  );
}

function ScanChips({ scan }: { scan: RepoScanResult }) {
  const checkIcon = <CheckIcon size={10} />;
  const xIcon = <XIcon size={10} />;
  if (scan.kind === 'found') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="green" icon={checkIcon}>spec</Chip>
        <Chip tone="green" icon={checkIcon}>tests</Chip>
      </div>
    );
  }
  if (scan.kind === 'partial') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={scan.specPath ? 'green' : 'amber'} icon={scan.specPath ? checkIcon : xIcon}>spec</Chip>
        <Chip tone={scan.testsPath ? 'green' : 'amber'} icon={scan.testsPath ? checkIcon : xIcon}>tests</Chip>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip tone="amber" icon={xIcon}>no spec</Chip>
      <Chip tone="amber" icon={xIcon}>no tests</Chip>
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

