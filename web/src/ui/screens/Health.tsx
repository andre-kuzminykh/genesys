import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useSpec, useStartup, useStore } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { ScoreRing } from '../components/ScoreRing';
import { useScoreFor } from '../hooks';
import { ChartIcon, FlaskIcon, PlayIcon, SparkleIcon } from '../design/Icon';

export function Health() {
  const { id } = useParams<{ id: string }>();
  const startup = useStartup(id);
  const spec = useSpec(id);
  const score = useScoreFor(id ?? '');
  const { state, runSimulation, setAuxScores } = useStore();

  const lastSim = useMemo(() => {
    return [...state.simulations]
      .filter((x) => x.startupId === id)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [state.simulations, id]);

  if (!startup || !spec || !score) return null;

  const personaMean = lastSim
    ? Math.round((lastSim.results.reduce((a, r) => a + r.score, 0) / lastSim.results.length) * 10) / 10
    : 0;

  const sim = () => {
    const r = runSimulation(startup.id);
    if (!r.ok) alert(r.reason === 'SPEC_TOO_THIN' ? 'Spec is too thin — add nodes first.' : r.reason);
  };

  return (
    <div className="space-y-5">
      <Bento tone="yellow">
        <BentoHeader
          eyebrow="composite signal"
          title="Demo-day Readiness"
          right={<Chip tone="yellow">batch weights</Chip>}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <ScoreRing value={score.readiness} label="Readiness" tone="yellow" />
          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Spec" value={score.specCompleteness} tone="neon-400" />
            <Metric label="Trace" value={score.traceCoverage} tone="sky-400" />
            <Metric label="Tests" value={score.testPassRate} tone="signal-green" />
            <Metric label="Persona" value={score.personaSatisfaction} tone="signal-violet" />
            <Metric label="Demand" value={score.investorDemand} tone="signal-amber" />
            <Metric label="Market" value={score.marketPotential} tone="sky-400" />
            <Metric label="Pitch" value={score.pitchScore} tone="signal-amber" />
            <Metric label="Tech" value={score.techExecution} tone="signal-green" />
          </div>
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="lg:col-span-2">
          <BentoHeader
            eyebrow="ai user simulation"
            title="Persona feedback"
            right={
              <button onClick={sim} className="neon-button !py-2"><PlayIcon /> Run simulation</button>
            }
          />
          {lastSim ? (
            <ul className="mt-4 space-y-3">
              {lastSim.results.map((r) => (
                <li key={r.personaId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-800/60 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/[0.04] font-display text-xs">
                      {labelFor(r.personaId).initials}
                    </div>
                    <div>
                      <div className="text-sm">{labelFor(r.personaId).label}</div>
                      <div className="text-xs text-white/40">{r.notes}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-1.5 rounded-full bg-white/[0.06]">
                      <div className="h-1.5 rounded-full bg-neon-500" style={{ width: r.score + '%' }} />
                    </div>
                    <span className="w-10 text-right font-display text-base font-medium text-neon-400">{r.score}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 flex flex-col items-start gap-3 text-white/60">
              <div className="flex items-center gap-2"><SparkleIcon className="text-neon-400" /> No simulation yet.</div>
              <button onClick={sim} className="neon-button"><PlayIcon /> Run first simulation</button>
            </div>
          )}
          {lastSim ? (
            <div className="display-mono mt-4">last run · {new Date(lastSim.createdAt).toLocaleString()} · mean {personaMean}</div>
          ) : null}
        </Bento>

        <Bento>
          <BentoHeader
            eyebrow="manual signals"
            title="Tech / Market / Pitch"
            right={<FlaskIcon className="text-sky-400" />}
          />
          <p className="mt-2 text-xs text-white/40">
            Tunable by you. In V1, tech execution is computed from actual CI signal.
          </p>
          <div className="mt-4 space-y-3">
            <SliderRow label="Tech execution" value={startup.techExecution} onChange={(v) => setAuxScores(startup.id, { techExecution: v })} />
            <SliderRow label="Market potential" value={startup.marketPotential} onChange={(v) => setAuxScores(startup.id, { marketPotential: v })} />
            <SliderRow label="Pitch score" value={startup.pitchScore} onChange={(v) => setAuxScores(startup.id, { pitchScore: v })} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3 text-xs text-white/60">
            <div className="flex items-center gap-2 text-white/80"><ChartIcon className="text-neon-400" /> Composition</div>
            <div className="mt-2 font-mono">{Math.round(score.readiness)} = w·signals</div>
            <div className="mt-1 text-white/40">weights are set per batch by the admin.</div>
          </div>
        </Bento>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
      <div className="display-mono">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold text-${tone}`}>{Math.round(value)}</div>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="label">{label}</div>
        <span className="font-mono text-xs text-neon-400">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#F9F26B]"
      />
    </div>
  );
}

const PERSONA_LABEL: Record<string, { label: string; initials: string }> = {
  impatient: { label: 'Impatient user', initials: 'IM' },
  technical: { label: 'Technical user', initials: 'TE' },
  budget_sensitive: { label: 'Budget-sensitive', initials: 'BU' },
  enterprise_buyer: { label: 'Enterprise buyer', initials: 'EN' },
  student: { label: 'Student', initials: 'ST' },
  founder: { label: 'Founder', initials: 'FO' },
  skeptical_investor: { label: 'Skeptical investor', initials: 'SK' },
  power_user: { label: 'Power user', initials: 'PW' },
  confused_first_time: { label: 'First-time user', initials: 'FT' },
};
function labelFor(id: string) {
  return PERSONA_LABEL[id] ?? { label: id, initials: id.slice(0, 2).toUpperCase() };
}
