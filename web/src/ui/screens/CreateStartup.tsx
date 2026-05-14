import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { useStore } from '../AppStore';
import { ArrowRightIcon, RocketIcon, SparkleIcon } from '../design/Icon';

const CATEGORIES = ['devtools', 'ai-quality', 'ops', 'fintech', 'hardware', 'consumer', 'health', 'edtech'];

export function CreateStartup() {
  const { createStartup } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = createStartup({ name, pitch, category, description });
    if (!r.ok) {
      const reasonMap: Record<string, string> = {
        MISSING_NAME: 'Add a name.',
        MISSING_PITCH: 'Add a one-line pitch.',
        MISSING_CATEGORY: 'Pick a category.',
        DUPLICATE_NAME: 'A startup with this name already exists in your batch.',
        NO_SESSION: 'You are not logged in.',
      };
      setErr(reasonMap[r.reason] ?? r.reason);
      return;
    }
    nav(`/app/startups/${r.startupId}/interview`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Chip tone="yellow" icon={<RocketIcon size={12} />}>MODE-1 · PRD</Chip>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Create a new startup</h1>
        <p className="mt-2 text-white/50">
          Name your startup, write a one-line pitch, pick a category. The AI Analyst will take it from there.
        </p>
      </div>

      <Bento padding="p-7">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Name" hint="Becomes the public identity in the cohort.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aurora"
              className="w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-4 py-3 outline-none focus:border-neon-500/60"
            />
          </Field>

          <Field label="One-line pitch" hint="Use the form: '{Product} is {what} for {who}.'">
            <input
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="A spec-first startup OS for AI-native founders."
              className="w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-4 py-3 outline-none focus:border-neon-500/60"
            />
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-2xl border px-3 py-1.5 text-sm transition ${
                    category === c
                      ? 'border-neon-500 bg-neon-500/10 text-neon-400'
                      : 'border-white/[0.08] text-white/70 hover:border-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Optional context" hint="What's the problem? Who feels it? Why now?">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A few sentences are enough — the Analyst will probe further."
              className="w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-4 py-3 outline-none focus:border-neon-500/60"
            />
          </Field>

          {err ? (
            <div className="rounded-xl border border-signal-red/40 bg-signal-red/10 px-3 py-2 text-sm text-signal-red">
              {err}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Chip tone="sky" icon={<SparkleIcon size={12} />}>Spec hierarchy will be auto-generated</Chip>
            <button type="submit" className="neon-button">
              Continue to AI interview <ArrowRightIcon />
            </button>
          </div>
        </form>
      </Bento>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="label">{label}</div>
        {hint ? <div className="text-xs text-white/40">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}
