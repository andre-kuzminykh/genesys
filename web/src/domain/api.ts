/**
 * Genesys backend client.
 *
 * Talks to /api/* on the same origin (nginx proxies to the auth container).
 * All state mutations go through here so every signed-in user sees the same
 * upvote totals and the same wallet of investments.
 */

export interface ServerState {
  upvotes: Record<string, string[]>;
  investments: Array<{ startupId: string; investorHandle: string; amount: number; ts: number }>;
}

export interface UpvoteResponse {
  ok: true;
  startupId: string;
  voted: boolean;
  count: number;
  login: string;
}

export interface InvestResponse {
  ok: true;
  investment: { startupId: string; investorHandle: string; amount: number; ts: number };
  walletRemaining: number;
}

export type ApiErrorCode =
  | 'NO_TOKEN'
  | 'BAD_TOKEN'
  | 'NOT_IN_ALLOWLIST'
  | 'NO_STARTUP_ID'
  | 'INVALID_AMOUNT'
  | 'SELF_INVEST_FORBIDDEN'
  | 'INSUFFICIENT_CREDITS'
  | 'NETWORK';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(res: Response, fallbackCode: ApiErrorCode): Promise<ApiError> {
  try {
    const j = await res.json();
    const code = (j?.error ?? fallbackCode) as ApiErrorCode;
    return new ApiError(code, j?.error ?? res.statusText, res.status);
  } catch {
    return new ApiError(fallbackCode, res.statusText, res.status);
  }
}

export async function fetchState(): Promise<ServerState> {
  const r = await fetch('/api/state', { headers: { Accept: 'application/json' } });
  if (!r.ok) throw await readError(r, 'NETWORK');
  return (await r.json()) as ServerState;
}

export async function postUpvote(token: string, startupId: string): Promise<UpvoteResponse> {
  const r = await fetch('/api/upvote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ startupId }),
  });
  if (!r.ok) throw await readError(r, 'NETWORK');
  return (await r.json()) as UpvoteResponse;
}

export async function postInvest(token: string, startupId: string, amount: number): Promise<InvestResponse> {
  const r = await fetch('/api/invest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ startupId, amount }),
  });
  if (!r.ok) throw await readError(r, 'NETWORK');
  return (await r.json()) as InvestResponse;
}
