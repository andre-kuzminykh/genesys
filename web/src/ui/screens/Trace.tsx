import { useParams } from 'react-router-dom';
import { useSpec, useStore } from '../AppStore';
import { buildTraceability, tracePercent } from '@/domain/traceability';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { CheckIcon, XIcon } from '../design/Icon';
import { nodesByKind } from '@/domain/spec';
import { useMemo, useState } from 'react';

export function Trace() {
  const { id } = useParams<{ id: string }>();
  const spec = useSpec(id);
  const { linkFrToTest } = useStore();
  const [select, setSelect] = useState<string>('');

  const tests = useMemo(() => spec ? nodesByKind(spec, 'TEST') : [], [spec]);
  const coverage = useMemo(() => spec ? buildTraceability(spec) : [], [spec]);
  const percent = useMemo(() => spec ? tracePercent(spec) : 0, [spec]);

  if (!spec || !id) return null;

  const missing = coverage.filter((c) => c.status === 'MISSING').length;

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="requirements traceability"
          title="Coverage matrix"
          right={<Chip tone={missing === 0 ? 'green' : 'amber'}>{Math.round(percent)}% covered</Chip>}
        />
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Every functional requirement must point to at least one test. Missing tests are surfaced
          so the founder can fix the gap before MODE-6 build.
        </p>
      </Bento>

      <Bento>
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] pb-2 text-xs text-white/40 uppercase tracking-widest">
          <div className="col-span-2">FR</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Tests</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        {coverage.length === 0 ? (
          <div className="py-6 text-sm text-white/50">No functional requirements yet — run the AI Analyst or add FR nodes in the Spec workspace.</div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {coverage.map((c) => (
              <li key={c.frId} className="grid grid-cols-12 items-center gap-2 py-3">
                <div className="col-span-2 font-mono text-xs text-neon-400">{c.frId}</div>
                <div className="col-span-5 text-sm text-white/80">{c.frTitle}</div>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {c.tests.length === 0 ? (
                    <span className="text-xs text-white/40">— none —</span>
                  ) : c.tests.map((t) => <Chip key={t} tone="red">{t}</Chip>)}
                  <button
                    onClick={() => {
                      if (!select) { alert('Pick a TEST first below.'); return; }
                      linkFrToTest(id, c.frId, select);
                    }}
                    className="ghost-button !py-1 !px-2 text-[10px]"
                    title="Link selected TEST to this FR"
                  >
                    + link
                  </button>
                </div>
                <div className="col-span-2 text-right">
                  <Chip tone={c.status === 'COVERED' ? 'green' : 'red'}>
                    {c.status === 'COVERED' ? <CheckIcon size={12} /> : <XIcon size={12} />}
                    {c.status}
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
          <div className="label">Select a TEST to link</div>
          <select
            value={select}
            onChange={(e) => setSelect(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-ink-900/80 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
          >
            <option value="">— pick a test —</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.id} · {t.title}</option>
            ))}
          </select>
        </div>
      </Bento>
    </div>
  );
}
