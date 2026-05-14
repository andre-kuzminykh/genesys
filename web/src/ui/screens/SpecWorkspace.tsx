import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip, StatusChip } from '../components/Chip';
import { useSpec, useStore } from '../AppStore';
import { activeNodes, historyFor } from '@/domain/spec';
import type { SpecKind, SpecNode } from '@/domain/types';
import { PlusIcon, SparkleIcon, XIcon } from '../design/Icon';

const KIND_LABELS: { kind: SpecKind; label: string; tone: 'yellow' | 'sky' | 'violet' | 'green' | 'amber' | 'neutral' | 'red' }[] = [
  { kind: 'FEATURE', label: 'Features', tone: 'yellow' },
  { kind: 'STORY', label: 'User Stories', tone: 'sky' },
  { kind: 'FLOW', label: 'User Flows', tone: 'violet' },
  { kind: 'USE_CASE', label: 'Use Cases', tone: 'sky' },
  { kind: 'SCENARIO', label: 'BDD', tone: 'violet' },
  { kind: 'FR', label: 'FR', tone: 'green' },
  { kind: 'NFR', label: 'NFR', tone: 'amber' },
  { kind: 'TEST', label: 'Tests', tone: 'red' },
];

export function SpecWorkspace() {
  const { id } = useParams<{ id: string }>();
  const spec = useSpec(id);
  const { addNode, editNode, removeNode } = useStore();
  const [filter, setFilter] = useState<SpecKind | 'ALL'>('ALL');
  const [editing, setEditing] = useState<string | null>(null);

  const nodes = useMemo(() => spec ? activeNodes(spec) : [], [spec]);
  const filtered = filter === 'ALL' ? nodes : nodes.filter((n) => n.kind === filter);

  const counts = KIND_LABELS.map((k) => ({
    ...k,
    count: nodes.filter((n) => n.kind === k.kind).length,
  }));

  if (!spec || !id) return null;

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="claude.md · artifact registry"
          title="Spec hierarchy"
          right={
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const n = addNode(id, { kind: filter === 'ALL' ? 'FEATURE' : filter, title: 'New ' + (filter === 'ALL' ? 'FEATURE' : filter).toLowerCase() });
                  if (n) setEditing(n.id);
                }}
                className="neon-button !py-2"
              >
                <PlusIcon /> Add node
              </button>
            </div>
          }
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip active={filter === 'ALL'} label={`All (${nodes.length})`} onClick={() => setFilter('ALL')} tone="neutral" />
          {counts.map((c) => (
            <FilterChip key={c.kind} active={filter === c.kind} label={`${c.label} (${c.count})`} onClick={() => setFilter(c.kind)} tone={c.tone} />
          ))}
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <Bento>
              <div className="flex items-center gap-2">
                <SparkleIcon className="text-neon-400" />
                <div className="font-display text-lg">Nothing here yet</div>
              </div>
              <p className="mt-1 text-sm text-white/50">Run the AI Analyst interview or add a node manually.</p>
            </Bento>
          ) : filtered.map((n) => (
            <NodeRow
              key={n.id}
              node={n}
              versionCount={historyFor(spec, n.id).length}
              onOpen={() => setEditing(n.id)}
            />
          ))}
        </div>

        <div className="space-y-3">
          {editing ? (
            <NodeEditor
              startupId={id}
              node={spec.nodes.find((n) => n.id === editing && (n.status !== 'REPLACED' && n.status !== 'OBSOLETE'))!}
              onSave={(patch) => {
                const r = editNode(id, editing, patch);
                if (r.ok) setEditing(null);
                else alert(r.reason);
              }}
              onDelete={() => { removeNode(id, editing); setEditing(null); }}
              onClose={() => setEditing(null)}
            />
          ) : (
            <Bento>
              <div className="display-mono">inspector</div>
              <p className="mt-2 text-sm text-white/50">Pick a node to view/edit. Every edit creates a new version. Previous versions are preserved as REPLACED in History.</p>
            </Bento>
          )}
        </div>
      </div>
    </div>
  );
}

function NodeRow({ node, versionCount, onOpen }: { node: SpecNode; versionCount: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="block w-full text-left bento p-4 transition hover:border-neon-500/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neon-400">{node.id}</span>
            <Chip tone="neutral">v{node.version}</Chip>
            <StatusChip status={node.status} />
            <Chip tone="sky">{node.kind}</Chip>
          </div>
          <div className="mt-1 truncate font-display text-base">{node.title}</div>
          {node.body ? <div className="mt-1 line-clamp-2 text-xs text-white/50">{node.body}</div> : null}
        </div>
        <div className="text-right">
          <div className="display-mono">history</div>
          <div className="font-mono text-sm">{versionCount}</div>
        </div>
      </div>
      {node.links.tests.length > 0 || node.links.ucs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {node.links.tests.map((t) => <Chip key={t} tone="red">{t}</Chip>)}
          {node.links.ucs.map((u) => <Chip key={u} tone="sky">{u}</Chip>)}
        </div>
      ) : null}
    </button>
  );
}

function NodeEditor({
  node,
  onSave,
  onDelete,
  onClose,
}: {
  startupId: string;
  node: SpecNode;
  onSave: (patch: { title?: string; body?: string; reason?: string; links?: Partial<SpecNode['links']> }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [body, setBody] = useState(node.body);
  const [reason, setReason] = useState('');

  return (
    <Bento>
      <div className="flex items-center justify-between">
        <div className="display-mono">{node.kind} · {node.id} · v{node.version}</div>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
          <XIcon size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="label">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
          />
        </div>
        <div>
          <div className="label">Body</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm font-mono outline-none focus:border-neon-500/60"
          />
        </div>
        <div>
          <div className="label">Reason for change</div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. align with new self-invest policy"
            className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button onClick={onDelete} className="danger-button !py-2 !px-3 text-xs">Mark obsolete</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="ghost-button !py-2 !px-3 text-xs">Cancel</button>
            <button
              onClick={() => onSave({ title, body, reason: reason || undefined })}
              className="neon-button !py-2 !px-3 text-xs"
            >
              Save as v{node.version + 1}
            </button>
          </div>
        </div>
      </div>
    </Bento>
  );
}

function FilterChip({ active, label, onClick, tone }: { active: boolean; label: string; onClick: () => void; tone: 'yellow' | 'sky' | 'violet' | 'green' | 'amber' | 'neutral' | 'red' }) {
  const toneCls: Record<string, string> = {
    neutral: 'border-white/10 text-white/70',
    yellow: 'border-neon-500/40 text-neon-400',
    sky: 'border-sky-500/40 text-sky-400',
    violet: 'border-signal-violet/40 text-signal-violet',
    green: 'border-signal-green/40 text-signal-green',
    amber: 'border-signal-amber/40 text-signal-amber',
    red: 'border-signal-red/40 text-signal-red',
  };
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? 'bg-white/[0.08] text-white' : 'bg-white/[0.02]'} ${toneCls[tone]}`}
    >
      {label}
    </button>
  );
}
