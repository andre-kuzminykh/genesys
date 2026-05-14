import { Link } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import {
  ArrowRightIcon,
  ChartIcon,
  GithubIcon,
  RocketIcon,
  SparkleIcon,
  SpecIcon,
  TrophyIcon,
} from '../design/Icon';

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(900px_600px_at_50%_-20%,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-radial-neon blur-3xl opacity-90" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500 text-ink-950 font-display text-lg font-bold shadow-neon">
            G
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">Genesis</div>
            <div className="display-mono">startup studio</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="ghost-button">
            <GithubIcon /> Login
          </Link>
          <Link to="/login" className="neon-button">
            Enter studio <ArrowRightIcon />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-10">
        <div className="flex flex-col items-center text-center">
          <Chip tone="yellow" icon={<SparkleIcon size={12} />}>
            Spec-first · AI-native · Demo-day ready
          </Chip>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            The startup operating system for the
            <span className="ml-3 inline-block rounded-2xl bg-neon-500 px-3 py-1 text-ink-950">AI-native</span>
            <br />
            economy.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/60">
            Genesis turns a raw idea into a versioned product specification, GitHub-connected
            tests, a live market simulation and a demo-day ranking — by following the same
            CLAUDE.md methodology you can also use directly with Claude Code.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="neon-button text-base">
              <GithubIcon /> Continue with GitHub
            </Link>
            <a href="#how" className="ghost-button text-base">
              How it works <ArrowRightIcon />
            </a>
          </div>
          <div className="display-mono mt-6">github is the only entry point · allowlist-gated · for the GENESIS-001 cohort</div>
        </div>

        {/* hero bento mock */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Bento tone="yellow" className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="display-mono">your startup</div>
                <div className="mt-1 font-display text-2xl font-semibold">Aurora</div>
                <div className="mt-1 text-sm text-white/60">Spec-first startup OS for AI-native founders.</div>
              </div>
              <Chip tone="yellow">MODE-3 · ARCHITECTURE</Chip>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: 'Spec', value: 88, tone: 'text-neon-400' },
                { label: 'Trace', value: 92, tone: 'text-sky-400' },
                { label: 'Tests', value: 76, tone: 'text-signal-green' },
                { label: 'Persona', value: 71, tone: 'text-signal-violet' },
              ].map((m) => (
                <div key={m.label} className="bento-inset p-3">
                  <div className="display-mono">{m.label}</div>
                  <div className={`mt-1 font-display text-2xl font-semibold ${m.tone}`}>{m.value}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                    <div className={`h-1.5 rounded-full ${m.tone.replace('text', 'bg')} opacity-80`} style={{ width: m.value + '%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bento-inset p-3">
                <div className="display-mono">last spec change</div>
                <div className="mt-1 text-sm">FR-GEN-031 · v2 · <span className="text-signal-amber">UPDATED</span></div>
                <div className="mt-0.5 text-xs text-white/40">reason: align with new self-invest policy</div>
              </div>
              <div className="bento-inset p-3">
                <div className="display-mono">market signal</div>
                <div className="mt-1 text-sm">+450 credits this hour</div>
                <div className="mt-0.5 text-xs text-white/40">3 investors · 1 negative review</div>
              </div>
            </div>
          </Bento>

          <Bento tone="sky">
            <div className="flex items-center justify-between">
              <div className="display-mono">leaderboard · b1</div>
              <Chip tone="sky">live</Chip>
            </div>
            <ol className="mt-4 space-y-3">
              {[
                { name: 'Pulse', score: 82, t: '+4.1' },
                { name: 'Aurora', score: 78, t: '+1.9' },
                { name: 'Nebula', score: 64, t: '−0.3' },
                { name: 'Orbit', score: 41, t: '+0.0' },
              ].map((s, i) => (
                <li key={s.name} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] font-mono text-xs">{i + 1}</div>
                    <div className="text-sm">{s.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-medium text-neon-400">{s.score}</span>
                    <span className={`text-xs ${s.t.startsWith('+') ? 'text-signal-green' : 'text-signal-red'}`}>{s.t}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Bento>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              eyebrow: 'MODE-1 · PRD',
              icon: <SparkleIcon className="text-neon-400" />,
              title: 'AI Analyst interviews you',
              body: 'A deterministic-by-default analyst turns intent into Features, Stories, Use Cases, BDD scenarios, FR and NFR — each with stable IDs.',
            },
            {
              eyebrow: 'MODE-2..5',
              icon: <SpecIcon className="text-sky-400" />,
              title: 'Spec is versioned and visible',
              body: 'Every change is a new version with diffs, reason and author. The Mermaid architecture updates live from the same model.',
            },
            {
              eyebrow: 'MODE-6',
              icon: <RocketIcon className="text-signal-violet" />,
              title: 'TDD against /genesis/spec',
              body: 'Claude Code or SuperAgent writes code against your tests. Genesis tracks coverage and product health on one screen.',
            },
            {
              eyebrow: 'DEMO DAY',
              icon: <TrophyIcon className="text-neon-400" />,
              title: 'Market, not popularity',
              body: 'Peers allocate Genesis Credits. AI personas score your product as users. The leaderboard is composed of seven signals.',
            },
            {
              eyebrow: 'AUTH',
              icon: <GithubIcon className="text-sky-400" />,
              title: 'GitHub-only entry',
              body: 'Allowlisted handles only. The session is the single source of truth across all protected routes.',
            },
            {
              eyebrow: 'METHOD',
              icon: <ChartIcon className="text-signal-violet" />,
              title: 'CLAUDE.md as the engine',
              body: 'Modes, statuses, artifacts and transitions are first-class entities — the product runs the methodology.',
            },
          ].map((c) => (
            <Bento key={c.title}>
              <div className="display-mono">{c.eyebrow}</div>
              <div className="mt-2 flex items-center gap-2">
                {c.icon}
                <div className="font-display text-lg font-medium">{c.title}</div>
              </div>
              <p className="mt-2 text-sm text-white/60">{c.body}</p>
            </Bento>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs text-white/40">
          <div>genesis startup studio · v0.1.0</div>
          <div className="display-mono">claude-md · single source of methodology</div>
        </div>
      </footer>
    </div>
  );
}
