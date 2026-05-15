import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { useStore } from '../AppStore';
import { ArrowRightIcon, RocketIcon, SparkleIcon, XIcon } from '../design/Icon';
import { normalizeTag, normalizeTags, popularTags } from '@/domain/tags';

const CATEGORIES = ['Coding', 'Image', 'Audio', 'Video', 'Writing', 'Marketing', 'Sales', 'Data', 'Research', 'Productivity', 'Education', 'Health', 'Finance', 'Legal', 'Design'];

const SUGGESTED_TAGS = [
  'ai', 'llm', 'agents', 'rag', 'b2b', 'b2c', 'devtools', 'productivity',
  'image-gen', 'audio', 'voice', 'video', 'writing', 'analytics', 'observability',
  'marketing', 'sales', 'support', 'research', 'education', 'health', 'finance', 'design',
];

export function CreateStartup() {
  const { createStartup, state } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // Combined suggested + popular-in-the-cohort tags so users see hashtags
  // that are already in active use.
  const suggestions = useMemo(() => {
    const fromCohort = popularTags(state.startups, 30).map((t) => t.tag);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of [...SUGGESTED_TAGS, ...fromCohort]) {
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [state.startups]);

  const addTag = (raw: string) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = createStartup({ name, pitch, category, description, hashtags: normalizeTags([category.toLowerCase(), ...tags]) });
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
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">Create a new startup</h1>
        <p className="mt-2 text-textsec">
          Name your startup, write a one-line pitch, pick a category and tag it. The AI Analyst takes it from there.
        </p>
      </div>

      <Bento padding="p-7">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Name" hint="Becomes the public identity in the cohort.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aurora"
              className="w-full rounded-2xl border border-surfaceLight bg-base px-4 py-3 outline-none focus:border-neon-500/60"
            />
          </Field>

          <Field label="One-line pitch" hint="Use the form: '{Product} is {what} for {who}.'">
            <input
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="A spec-first startup OS for AI-native founders."
              className="w-full rounded-2xl border border-surfaceLight bg-base px-4 py-3 outline-none focus:border-neon-500/60"
            />
          </Field>

          <Field label="Primary category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    category === c
                      ? 'border-neon-500 bg-neon-500 text-base'
                      : 'border-surfaceLight bg-surface text-textsec hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Hashtags" hint="Add as many as you want — they drive the feed filters.">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {tags.length === 0 ? (
                  <span className="text-xs text-textsec">no hashtags yet — pick from the suggestions or type your own ↓</span>
                ) : null}
                {tags.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => removeTag(t)}
                    className="inline-flex items-center gap-1 rounded-full bg-neon-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-base hover:bg-neon-400"
                  >
                    #{t} <XIcon size={10} />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-3 py-2">
                <span className="text-textsec">#</span>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault();
                      addTag(tagDraft);
                    } else if (e.key === 'Backspace' && tagDraft === '' && tags.length > 0) {
                      removeTag(tags[tags.length - 1]!);
                    }
                  }}
                  placeholder="add your own — Enter, space or comma to confirm"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-textsec"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagDraft)}
                  disabled={!normalizeTag(tagDraft)}
                  className="ghost-button !py-1.5 !px-3 text-xs disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {suggestions
                  .filter((t) => !tags.includes(t))
                  .slice(0, 24)
                  .map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => addTag(t)}
                      className="rounded-full border border-surfaceLight bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-textsec hover:text-neon-500 hover:border-neon-500/40"
                    >
                      #{t}
                    </button>
                  ))}
              </div>
            </div>
          </Field>

          <Field label="Optional context" hint="What's the problem? Who feels it? Why now?">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A few sentences are enough — the Analyst will probe further."
              className="w-full rounded-2xl border border-surfaceLight bg-base px-4 py-3 outline-none focus:border-neon-500/60"
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
        {hint ? <div className="text-xs text-textsec">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}
