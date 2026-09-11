import { Link, useLocation } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { GithubIcon, ShieldIcon, XIcon } from '../design/Icon';
import { useStore } from '../AppStore';

export function Denied() {
  const loc = useLocation() as { state?: { handle?: string } };
  const handle = loc.state?.handle;
  const { state } = useStore();
  const batch = state.batches.find((b) => b.id === state.activeBatchId);
  return (
    <div className="relative grid min-h-screen place-items-center">
      <div className="absolute inset-0 -z-10 grid-bg" />
      <Bento tone="violet" padding="p-8" className="max-w-lg">
        <Chip tone="red"><XIcon size={12} /> access denied</Chip>
        <h1 className="mt-4 font-display text-3xl font-semibold">Not on the allowlist</h1>
        <p className="mt-3 text-white/60">
          {handle ? <span>The handle <span className="font-mono text-neon-400">@{handle}</span> is not in the </span> : <span>This handle is not in the </span>}
          batch <span className="font-mono text-sky-400">{batch?.name}</span>.
        </p>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <ShieldIcon className="text-sky-400" />
            <span>Demo-day cohort is closed.</span>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Ask your instructor or admin to add your handle to the batch allowlist. Then return
            and sign in again.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Link to="/login" className="neon-button"><GithubIcon /> Try again</Link>
          <Link to="/" className="ghost-button">Back home</Link>
        </div>
      </Bento>
    </div>
  );
}
