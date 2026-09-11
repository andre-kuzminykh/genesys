import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useSpec } from '../AppStore';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip, StatusChip } from '../components/Chip';
import { historyFor } from '@/domain/spec';
import type { SpecNode } from '@/domain/types';
import { HistoryIcon, SparkleIcon } from '../design/Icon';

function diff(prev: SpecNode | undefined, next: SpecNode): { field: string; before: string; after: string }[] {
  if (!prev) return [];
  const out: { field: string; before: string; after: string }[] = [];
  const fields: Array<keyof SpecNode> = ['title', 'body'];
  for (const f of fields) {
    const a = String(prev[f] ?? '');
    const b = String(next[f] ?? '');
    if (a !== b) out.push({ field: f as string, before: a, after: b });
  }
  const linkKinds = ['tests', 'ucs', 'frs', 'scenarios'] as const;
  for (const k of linkKinds) {
    const a = JSON.stringify(prev.links[k]);
    const b = JSON.stringify(next.links[k]);
    if (a !== b) out.push({ field: 'links.' + k, before: a, after: b });
  }
  return out;
}

export function History() {
  const { id } = useParams<{ id: string }>();
  const spec = useSpec(id);

  // Group active (non-replaced/non-obsolete) nodes by their root id; collect history per node.
  const roots = useMemo(() => {
    if (!spec) return [];
    const seen = new Set<string>();
    const out: SpecNode[] = [];
    for (const n of spec.nodes) {
      if (n.status === 'REPLACED' || n.status === 'OBSOLETE') continue;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [spec]);

  const [focus, setFocus] = useState<string | null>(roots[0]?.id ?? null);
  const history = useMemo(() => (spec && focus ? historyFor(spec, focus) : []), [spec, focus]);

  if (!spec) return null;

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="versioning"
          title="Spec history"
          right={<Chip tone="sky"><HistoryIcon size={12} /> {roots.length} nodes</Chip>}
        />
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Every spec edit creates a new version. Previous versions are preserved as <code className="font-mono">REPLACED</code> so the change is auditable.
        </p>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="lg:col-span-1">
          <div className="display-mono">nodes</div>
          <ul className="mt-3 space-y-1.5">
            {roots.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => setFocus(n.id)}
                  className={`w-full text-left rounded-2xl border px-3 py-2 transition ${
                    focus === n.id ? 'border-neon-500/40 bg-neon-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-neon-400 truncate">{n.id}</span>
                    <Chip tone="neutral">v{n.version}</Chip>
                  </div>
                  <div className="mt-1 truncate text-sm">{n.title}</div>
                </button>
              </li>
            ))}
            {roots.length === 0 ? (
              <li className="text-sm text-white/40">No history yet.</li>
            ) : null}
          </ul>
        </Bento>

        <Bento className="lg:col-span-2">
          {focus ? (
            <>
              <div className="display-mono">history of {focus}</div>
              <div className="mt-3 space-y-3">
                {history.map((v, idx) => {
                  const prev = idx > 0 ? history[idx - 1] : undefined;
                  const diffs = diff(prev, v);
                  return (
                    <div key={v.id} className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Chip tone="yellow">v{v.version}</Chip>
                          <StatusChip status={v.status} />
                          {v.author ? <span className="font-mono text-xs text-white/40">@{v.author}</span> : null}
                        </div>
                        <span className="font-mono text-xs text-white/40">{new Date(v.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 font-display text-sm">{v.title}</div>
                      {v.reason ? <div className="mt-1 text-xs text-white/50">reason: {v.reason}</div> : null}
                      {diffs.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {diffs.map((d) => (
                            <div key={d.field}>
                              <div className="display-mono">{d.field}</div>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                <pre className="rounded-xl border border-signal-red/30 bg-signal-red/[0.06] p-2 whitespace-pre-wrap text-white/70">−  {d.before || '—'}</pre>
                                <pre className="rounded-xl border border-signal-green/30 bg-signal-green/[0.06] p-2 whitespace-pre-wrap text-white/70">+  {d.after || '—'}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-white/40">initial version</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-white/50">
              <SparkleIcon className="text-neon-400" /> Pick a node to view its history.
            </div>
          )}
        </Bento>
      </div>
    </div>
  );
}
