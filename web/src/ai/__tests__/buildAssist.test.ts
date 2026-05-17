import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildAssistError, suggestFeatures, suggestUser } from '../buildAssist';

function mockChat(content: string, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response);
}

describe('TEST-GEN-601-C — FR-GEN-601 buildAssist routes through the same-origin /api/llm/chat proxy', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = mockChat(JSON.stringify({ user: 'Indie game dev shipping pixel art on itch.io' }));
    globalThis.fetch =fetchSpy;
  });

  it('POSTs to /api/llm/chat with a JSON system prompt and parses the JSON response', async () => {
    const out = await suggestUser({ problem: 'too slow', solution: 'AI helper' });
    expect(out).toMatch(/Indie/i);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/llm/chat');
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages?.[0]?.role).toBe('system');
    expect(body.messages?.[1]?.content).toContain('too slow');
    expect(body.messages?.[1]?.content).toContain('AI helper');
  });
});

describe('TEST-GEN-607-C — FR-GEN-607 suggestFeatures clamps + normalises', () => {
  it('limits the result to ≤ 8 entries and forces priority to one of must/should/could', async () => {
    const bogus = Array.from({ length: 12 }, (_, i) => ({
      name: `F${i}`, oneliner: `o${i}`, priority: i % 2 === 0 ? 'random-junk' : 'must',
    }));
    globalThis.fetch =mockChat(JSON.stringify({ features: bogus }));

    const out = await suggestFeatures({});
    expect(out.length).toBeLessThanOrEqual(8);
    for (const f of out) {
      expect(['must', 'should', 'could']).toContain(f.priority);
    }
    // Even-index entries had 'random-junk' → normalised to 'should'.
    expect(out[0]!.priority).toBe('should');
    expect(out[1]!.priority).toBe('must');
  });
});

describe('TEST-GEN-602-CONTRACT — FR-GEN-602 NO_KEY surfaces as BuildAssistError', () => {
  it('throws BuildAssistError("NO_KEY") when /api/llm/chat replies 503', async () => {
    globalThis.fetch =vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'NO_OPENAI_KEY' }),
    } as unknown as Response);

    await expect(suggestUser({})).rejects.toMatchObject({
      name: 'BuildAssistError',
      code: 'NO_KEY',
    });
    await expect(suggestUser({})).rejects.toBeInstanceOf(BuildAssistError);
  });
});
