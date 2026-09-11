import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAILlmAdapter } from '../openai';

function mockChat(jsonContent: object, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(jsonContent) } }] }),
  } as unknown as Response);
}

describe('TEST-FR-LB-003-C — OpenAILlmAdapter.chat routes through /api/llm/chat proxy', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = mockChat({
      personas: { impatient: { score: 60, rationale: 'too clicky' } },
      summary: 'lukewarm',
      breakingPoints: ['needs onboarding'],
      delighters: ['nice tone'],
      shouldPay: false,
    });
    globalThis.fetch = fetchSpy;
  });

  it('POSTs the chat body to the same-origin proxy and never sends an Authorization header', async () => {
    const adapter = new OpenAILlmAdapter({ model: 'gpt-4o-mini' }); // no apiKey on purpose
    await adapter.reviewForUser({
      startup: {
        id: 'S-x', name: 'Acme', pitch: 'pitch', description: 'desc', repo: 'a/b',
        category: 'AI', hashtags: ['t'], coverImage: undefined, batchId: 'B1',
        ownerHandle: 'h', published: true, createdAt: 0,
      } as never,
      personas: ['impatient'],
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/llm/chat');
    // The proxy holds the OpenAI key — the browser must NOT carry one.
    const headers = ((init as RequestInit).headers ?? {}) as Record<string, string>;
    expect(Object.keys(headers).some((k) => k.toLowerCase() === 'authorization')).toBe(false);
    // Body forwards the chosen model to the proxy.
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages?.[0]?.role).toBe('system');
  });
});
