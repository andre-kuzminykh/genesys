import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { RocketIcon, ArrowRightIcon, GithubIcon, SparkleIcon } from '../design/Icon';

type IncomingState = {
  flow?: 'import' | 'scratch';
  repo?: string;
  startupName?: string;
};

export function ComingSoon() {
  const loc = useLocation() as { state?: IncomingState };
  const flow = loc.state?.flow;
  const repo = loc.state?.repo;
  const startupName = loc.state?.startupName;

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" aria-label="Genesys home">
          <Wordmark size="xl" />
        </Link>
        <Link to="/onboarding/repo" className="ghost-button"><GithubIcon /> Pick another repo</Link>
      </header>

      <main className="mx-auto grid min-h-[80vh] max-w-2xl place-items-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-neon-500 text-ink shadow-neon animate-floaty">
            <RocketIcon size={42} />
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            We'll launch this soon.
          </h1>
          <p className="mt-4 text-textsec">
            {flow === 'import' && repo
              ? <>We detected the spec & tests in <span className="font-mono text-neon-500">{repo}</span>. The dashboard that imports them is on its way.</>
              : flow === 'scratch'
                ? <>The startup builder for <span className="font-mono text-neon-500">{startupName ?? 'your new project'}</span> is on its way — we'll launch it soon.</>
                : <>The dashboard you tried to open is on its way. Come back shortly.</>}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/onboarding/repo" className="ghost-button">
              <GithubIcon /> Pick another repo
            </Link>
            <Link to="/" className="neon-button">
              <SparkleIcon /> Browse the cohort
            </Link>
          </div>

          <div className="display-mono mt-10">
            <ArrowRightIcon size={10} className="inline" /> Spec & tests will be imported in the next release
          </div>
        </div>
      </main>
    </div>
  );
}
