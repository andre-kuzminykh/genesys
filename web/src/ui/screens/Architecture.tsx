import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useSpec } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Mermaid } from '../components/Mermaid';
import { dataFlowFromArch, erdFromArch, layersFromArch, specGraph } from '../mermaid-build';
import { SparkleIcon } from '../design/Icon';

type Tab = 'layers' | 'erd' | 'flow' | 'spec';

export function Architecture() {
  const { id } = useParams<{ id: string }>();
  const spec = useSpec(id);
  const [tab, setTab] = useState<Tab>('layers');

  const charts = useMemo(() => {
    if (!spec) return null;
    return {
      layers: layersFromArch(spec.architecture),
      erd: erdFromArch(spec.architecture),
      flow: dataFlowFromArch(spec.architecture),
      spec: specGraph(spec),
    };
  }, [spec]);

  if (!spec || !charts) return null;

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="mode-3 · solution architecture"
          title="Live Mermaid diagrams"
          right={<Chip tone="sky" icon={<SparkleIcon size={12} />}>auto-generated from the spec model</Chip>}
        />
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Every diagram below renders from the same source — the architecture stored on this spec.
          Edit the model, and the next render reflects it. No manual diagram drift.
        </p>

        <div className="mt-4 inline-flex flex-wrap gap-1 rounded-2xl bg-ink-800/60 p-1">
          {(['layers', 'erd', 'flow', 'spec'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3 py-1.5 text-sm transition ${
                tab === t ? 'bg-neon-500 text-ink-950 font-medium' : 'text-white/60 hover:text-white'
              }`}
            >
              {t === 'layers' && 'Layered (Client / Service / AI / Data / Infra)'}
              {t === 'erd' && 'ERD'}
              {t === 'flow' && 'Data Flow'}
              {t === 'spec' && 'Spec Graph'}
            </button>
          ))}
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Bento className="xl:col-span-2">
          <Mermaid chart={charts[tab]} id={`mm-${tab}`} />
        </Bento>

        <Bento>
          <div className="display-mono">mermaid source</div>
          <pre className="mt-3 max-h-[560px] overflow-auto rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3 text-xs leading-relaxed text-white/70 font-mono">
{charts[tab]}
          </pre>
          <button
            onClick={() => navigator.clipboard?.writeText(charts[tab])}
            className="ghost-button mt-3 w-full !py-2 text-xs"
          >
            Copy source
          </button>
        </Bento>
      </div>
    </div>
  );
}
