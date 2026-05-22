/**
 * Pure-function game winners — extracted from Leaderboard.tsx so they can be
 * unit-tested without spinning up React.
 *
 * - `computeBestStartup` is just a reminder that the per-startup verdict list
 *   on Leaderboard already sorts by `compositeScore` (in `domain/simulation.ts`),
 *   so the #1 row IS the winner. No separate function needed.
 *
 * - `computeBestInvestor` is the interesting one: it scores each investor's
 *   portfolio by weighting each pick by the projected revenue of the startup
 *   they backed.
 */

export interface InvestmentRecord {
  startupId: string;
  investorHandle: string;
  amount: number;
}

export interface RevenueByStartup {
  [startupId: string]: number;
}

export interface BestInvestor {
  handle: string;       // lowercased
  invested: number;     // total $ committed
  score: number;        // amount × (startupRevenue / 1_000_000) summed
  picks: number;        // number of distinct investments (not unique startups)
}

const DEFAULT_REVENUE = 100_000;
const REVENUE_DENOMINATOR = 1_000_000;

/**
 * Reduce investments into a single "best investor" by revenue-weighted
 * portfolio score. Returns null when there are no investments.
 */
export function computeBestInvestor(
  investments: ReadonlyArray<InvestmentRecord>,
  revenueByStartup: RevenueByStartup = {},
): BestInvestor | null {
  if (investments.length === 0) return null;

  const portfolio: Record<string, { invested: number; score: number; picks: number }> = {};
  for (const inv of investments) {
    const handle = inv.investorHandle.toLowerCase();
    const slot = portfolio[handle] ?? { invested: 0, score: 0, picks: 0 };
    slot.invested += inv.amount;
    slot.picks += 1;
    const revenue = revenueByStartup[inv.startupId] ?? DEFAULT_REVENUE;
    slot.score += inv.amount * (revenue / REVENUE_DENOMINATOR);
    portfolio[handle] = slot;
  }

  const ranked = Object.entries(portfolio)
    .map(([handle, p]) => ({ handle, ...p }))
    .sort((a, b) => b.score - a.score || b.invested - a.invested);

  return ranked[0] ?? null;
}
