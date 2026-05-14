import { useParams } from 'react-router-dom';
import { useSpec, useStartup, useStore } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { ScoreRing } from '../components/ScoreRing';
import { Avatar } from '../components/Avatar';
import { useScoreFor } from '../hooks';
import { CheckIcon, GithubIcon, RocketIcon, ShopIcon, SparkleIcon } from '../design/Icon';

export function Showcase() {
  const { id } = useParams<{ id: string }>();
  const startup = useStartup(id);
  const spec = useSpec(id);
  const score = useScoreFor(id ?? '');
  const { togglePublished, state } = useStore();
  if (!startup || !spec || !score) return null;

  const owner = state.users.find((u) => u.handle === startup.ownerHandle);

  return (
    <div className="space-y-5">
      <Bento tone="yellow" padding="p-7" className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-neon blur-3xl opacity-70" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Avatar seed={startup.name} size={84} />
            <div>
              <Chip tone="yellow"><RocketIcon size={12} /> {startup.category}</Chip>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight">{startup.name}</h1>
              <p className="mt-1 max-w-xl text-white/70">{startup.pitch}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-white/60">
                <Avatar seed={owner?.handle ?? 'unknown'} size={22} />
                <span>{owner?.name ?? '@' + startup.ownerHandle}</span>
                {startup.repo ? <span className="font-mono">· {startup.repo}</span> : null}
              </div>
            </div>
          </div>
          <ScoreRing value={score.readiness} sublabel="readiness" tone="yellow" />
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => togglePublished(startup.id, !startup.published)} className={startup.published ? 'ghost-button' : 'neon-button'}>
            <CheckIcon /> {startup.published ? 'Published in marketplace' : 'Publish to marketplace'}
          </button>
          {startup.repo ? <a className="ghost-button" href={`https://github.com/${startup.repo}`} target="_blank" rel="noreferrer"><GithubIcon /> Open repo</a> : null}
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="lg:col-span-2">
          <BentoHeader eyebrow="signal mix" title="Why this score" />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Spec', score.specCompleteness, 'neon-400'],
              ['Trace', score.traceCoverage, 'sky-400'],
              ['Tests', score.testPassRate, 'signal-green'],
              ['Persona', score.personaSatisfaction, 'signal-violet'],
              ['Demand', score.investorDemand, 'signal-amber'],
              ['Market', score.marketPotential, 'sky-400'],
              ['Pitch', score.pitchScore, 'signal-amber'],
              ['Tech', score.techExecution, 'signal-green'],
            ].map(([label, v, tone]) => (
              <div key={String(label)} className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
                <div className="display-mono">{String(label)}</div>
                <div className={`mt-1 font-display text-2xl font-semibold text-${tone}`}>{Math.round(Number(v))}</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                  <div className={`h-1.5 rounded-full bg-${tone} opacity-80`} style={{ width: Math.max(2, Math.min(100, Number(v))) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </Bento>

        <Bento>
          <BentoHeader eyebrow="public card" title="What investors see" />
          <PublicCard name={startup.name} pitch={startup.pitch} category={startup.category} readiness={score.readiness} demand={score.investorDemand} />
          <div className="display-mono mt-3">This is the card rendered in the Marketplace.</div>
        </Bento>
      </div>

      <Bento>
        <BentoHeader eyebrow="what's inside" title="Spec highlights" right={<Chip tone="sky"><SparkleIcon size={12} /> claude.md artifacts</Chip>} />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { kind: 'FEATURE', label: 'Features' },
            { kind: 'STORY', label: 'User Stories' },
            { kind: 'USE_CASE', label: 'Use Cases' },
            { kind: 'SCENARIO', label: 'BDD' },
            { kind: 'FR', label: 'FR' },
            { kind: 'NFR', label: 'NFR' },
            { kind: 'TEST', label: 'Tests' },
            { kind: 'TASK', label: 'Tasks' },
          ].map((g) => {
            const n = spec.nodes.filter((x) => x.kind === g.kind && x.status !== 'REPLACED' && x.status !== 'OBSOLETE').length;
            return (
              <div key={g.kind} className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3 text-center">
                <div className="display-mono">{g.label}</div>
                <div className="mt-1 font-display text-2xl font-semibold">{n}</div>
              </div>
            );
          })}
        </div>
      </Bento>
    </div>
  );
}

function PublicCard({ name, pitch, category, readiness, demand }: { name: string; pitch: string; category: string; readiness: number; demand: number }) {
  return (
    <div className="mt-4 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-ink-800/60 to-ink-900/80 p-5">
      <div className="flex items-center gap-3">
        <Avatar seed={name} size={44} />
        <div>
          <div className="display-mono">{category}</div>
          <div className="font-display text-lg font-semibold">{name}</div>
        </div>
      </div>
      <div className="mt-3 line-clamp-3 text-sm text-white/70">{pitch}</div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <Chip tone="yellow">readiness {Math.round(readiness)}</Chip>
        <Chip tone="sky">demand {Math.round(demand)}</Chip>
      </div>
    </div>
  );
}
