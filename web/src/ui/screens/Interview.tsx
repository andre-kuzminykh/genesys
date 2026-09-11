import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { useStartup, useStore } from '../AppStore';
import { ArrowRightIcon, SparkleIcon } from '../design/Icon';

const QUESTIONS: { key: 'idea' | 'targetUser' | 'problem' | 'solution' | 'monetization'; q: string; hint: string }[] = [
  { key: 'idea', q: 'Restate your idea in one sentence.', hint: 'No buzzwords. Plain language.' },
  { key: 'targetUser', q: 'Who is the user — concretely?', hint: 'A role + a context. e.g. "Student founder preparing demo day".' },
  { key: 'problem', q: 'What problem do you remove from their day?', hint: 'Not market size — friction.' },
  { key: 'solution', q: 'In one sentence — your solution. Why now?', hint: '"We do X by Y, which is possible because Z."' },
  { key: 'monetization', q: 'How does value flow back to you?', hint: 'Plan can change. Hypothesis is fine.' },
];

export function Interview() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const startup = useStartup(id);
  const { runAnalystInterview } = useStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const isLast = step === QUESTIONS.length - 1;

  if (!startup) return <div className="p-6 text-white/60">Startup not found.</div>;

  const cur = QUESTIONS[step]!;
  const value = answers[cur.key] ?? '';

  const next = () => {
    if (!isLast) {
      setStep((n) => n + 1);
      return;
    }
    runAnalystInterview(startup.id, {
      idea: answers['idea'] || startup.pitch,
      category: startup.category,
      targetUser: answers['targetUser'],
      problem: answers['problem'],
      solution: answers['solution'],
    });
    nav(`/app/startups/${startup.id}/spec`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Chip tone="yellow" icon={<SparkleIcon size={12} />}>AI ANALYST · MODE-1</Chip>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Interview · {startup.name}</h1>
        </div>
        <Chip tone="sky">{step + 1}/{QUESTIONS.length}</Chip>
      </div>

      <Bento padding="p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-neon-500 text-ink-950">
            <SparkleIcon />
          </div>
          <div>
            <div className="display-mono">analyst</div>
            <div className="mt-1 font-display text-xl">{cur.q}</div>
            <div className="mt-1 text-sm text-white/40">{cur.hint}</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
          <textarea
            value={value}
            onChange={(e) => setAnswers((a) => ({ ...a, [cur.key]: e.target.value }))}
            placeholder="Type your answer…"
            rows={4}
            className="w-full resize-none bg-transparent text-base outline-none placeholder:text-white/30"
            autoFocus
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-white/40">
            Deterministic mock — your answers feed a templated generator. V1 swaps in a real LLM behind <code className="font-mono">AiAnalystPort</code>.
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button onClick={() => setStep((n) => n - 1)} className="ghost-button !py-2 !px-3 text-sm">
                Back
              </button>
            ) : null}
            <button onClick={next} className="neon-button">
              {isLast ? 'Generate spec' : 'Next'} <ArrowRightIcon />
            </button>
          </div>
        </div>
      </Bento>

      <Bento>
        <div className="flex items-center justify-between">
          <div className="font-display text-base">Progress</div>
          <Chip tone="neutral">{Object.values(answers).filter(Boolean).length}/{QUESTIONS.length} answered</Chip>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {QUESTIONS.map((q, i) => (
            <div key={q.key} className={`h-1.5 rounded-full ${i <= step ? 'bg-neon-500' : 'bg-white/[0.06]'}`} />
          ))}
        </div>
        <p className="mt-4 text-sm text-white/50">
          After the last question, the AI Analyst will generate Features, User Stories, Use Cases,
          BDD scenarios, Functional and Non-Functional Requirements, and Test stubs. All with
          stable IDs and editable in the next screen.
        </p>
      </Bento>
    </div>
  );
}
