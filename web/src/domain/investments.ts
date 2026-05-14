import type { AppState, Batch, Investment, Startup } from './types';

export interface InvestArgs {
  investorHandle: string;
  startupId: string;
  amount: number;
  now?: number;
}

export type InvestReason =
  | 'INVALID_AMOUNT'
  | 'STARTUP_NOT_PUBLISHED'
  | 'STARTUP_NOT_FOUND'
  | 'BATCH_NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'SELF_INVEST_FORBIDDEN';

export type InvestResult =
  | { ok: true; state: AppState; investment: Investment; remainingCredits: number }
  | { ok: false; reason: InvestReason };

function findBatchOfStartup(state: AppState, startupId: string): { batch: Batch; startup: Startup } | null {
  const startup = state.startups.find((s) => s.id === startupId);
  if (!startup) return null;
  const batch = state.batches.find((b) => b.id === startup.batchId);
  if (!batch) return null;
  return { batch, startup };
}

/** Remaining credits for an investor inside a given batch. */
export function remainingCredits(state: AppState, batchId: string, investorHandle: string): number {
  const batch = state.batches.find((b) => b.id === batchId);
  if (!batch) return 0;
  const spent = state.investments
    .filter((i) => i.batchId === batchId && i.investorHandle === investorHandle.toLowerCase())
    .reduce((a, b) => a + b.amount, 0);
  return Math.max(0, batch.creditsPerInvestor - spent);
}

let _seq = 1;
function nextId(now: number): string {
  return `INV-${now}-${_seq++}`;
}

/** FR-GEN-030..033 — invest credits with explicit error reasons. */
export function invest(state: AppState, args: InvestArgs): InvestResult {
  const amount = Math.floor(args.amount);
  const handle = args.investorHandle.toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'INVALID_AMOUNT' };

  const ctx = findBatchOfStartup(state, args.startupId);
  if (!ctx) return { ok: false, reason: 'STARTUP_NOT_FOUND' };
  const { batch, startup } = ctx;

  if (!startup.published) return { ok: false, reason: 'STARTUP_NOT_PUBLISHED' };
  if (handle === startup.ownerHandle.toLowerCase() && batch.selfInvestPolicy === 'FORBIDDEN') {
    return { ok: false, reason: 'SELF_INVEST_FORBIDDEN' };
  }
  if (handle === startup.ownerHandle.toLowerCase() && batch.selfInvestPolicy === 'LIMITED') {
    // LIMITED: max 10% of credits
    const cap = Math.floor(batch.creditsPerInvestor * 0.1);
    const spentOnSelf = state.investments
      .filter((i) => i.investorHandle === handle && i.startupId === startup.id)
      .reduce((a, b) => a + b.amount, 0);
    if (spentOnSelf + amount > cap) return { ok: false, reason: 'SELF_INVEST_FORBIDDEN' };
  }

  const remaining = remainingCredits(state, batch.id, handle);
  if (amount > remaining) return { ok: false, reason: 'INSUFFICIENT_CREDITS' };

  const now = args.now ?? Date.now();
  const investment: Investment = {
    id: nextId(now),
    batchId: batch.id,
    investorHandle: handle,
    startupId: startup.id,
    amount,
    createdAt: now,
  };
  const newState: AppState = { ...state, investments: [...state.investments, investment] };
  return { ok: true, state: newState, investment, remainingCredits: remaining - amount };
}

export function investorPortfolio(state: AppState, investorHandle: string): Array<{
  startupId: string;
  amount: number;
}> {
  const h = investorHandle.toLowerCase();
  const map = new Map<string, number>();
  for (const inv of state.investments.filter((i) => i.investorHandle === h)) {
    map.set(inv.startupId, (map.get(inv.startupId) ?? 0) + inv.amount);
  }
  return Array.from(map.entries()).map(([startupId, amount]) => ({ startupId, amount }));
}
