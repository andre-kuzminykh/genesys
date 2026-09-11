/**
 * Persistent draft for the multi-step Build wizard.
 *
 * Saved to localStorage under `genesys:build-draft:v1` so the founder can
 * close the tab, come back, and pick up where they left off.
 */

export interface ProductFoundation {
  user: string;
  problem: string;
  solution: string;
  metrics: string[];
  /** Cover artwork — uploaded data URL or generated via /api/llm/image. */
  coverImage?: string;
}

export type FeaturePriority = 'must' | 'should' | 'could';
export interface FeatureRow {
  id: string;
  name: string;
  oneliner: string;
  priority: FeaturePriority;
}

export interface BuildDraft {
  product: ProductFoundation;
  features: FeatureRow[];
  workingFeatureId: string | null;
  updatedAt: number;
}

const KEY = 'genesys:build-draft:v1';

export const EMPTY_DRAFT: BuildDraft = {
  product: { user: '', problem: '', solution: '', metrics: [''], coverImage: '' },
  features: [],
  workingFeatureId: null,
  updatedAt: 0,
};

export function loadDraft(): BuildDraft {
  if (typeof localStorage === 'undefined') return { ...EMPTY_DRAFT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_DRAFT };
    const parsed = JSON.parse(raw) as Partial<BuildDraft>;
    return {
      product: {
        user:     parsed?.product?.user ?? '',
        problem:  parsed?.product?.problem ?? '',
        solution: parsed?.product?.solution ?? '',
        metrics:  Array.isArray(parsed?.product?.metrics) && parsed!.product!.metrics!.length
          ? parsed!.product!.metrics!.map(String)
          : [''],
        coverImage: typeof parsed?.product?.coverImage === 'string' ? parsed!.product!.coverImage! : '',
      },
      features: Array.isArray(parsed?.features) ? parsed!.features!.map((f) => ({
        id: String(f.id ?? randomId()),
        name: String(f.name ?? ''),
        oneliner: String(f.oneliner ?? ''),
        priority: (f.priority === 'must' || f.priority === 'should' || f.priority === 'could') ? f.priority : 'should',
      })) : [],
      workingFeatureId: typeof parsed?.workingFeatureId === 'string' ? parsed.workingFeatureId : null,
      updatedAt: Number.isFinite(Number(parsed?.updatedAt)) ? Number(parsed?.updatedAt) : 0,
    };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function saveDraft(d: BuildDraft): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...d, updatedAt: Date.now() }));
  } catch { /* quota? ignore */ }
}

export function clearDraft(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
