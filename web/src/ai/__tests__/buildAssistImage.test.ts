import { describe, it, expect, vi } from 'vitest';
import { BuildAssistError, generateCoverImage } from '../buildAssist';

const fakeB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/aJ9ZqIAAAAASUVORK5CYII=';

describe('TEST-FR-BUILD-IMG-001-C — generateCoverImage happy path', () => {
  it('returns a data:image/png;base64,<bytes> URL when the proxy returns data[0].b64_json', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ b64_json: fakeB64 }] }),
    } as unknown as Response);
    globalThis.fetch = fetchSpy;

    const url = await generateCoverImage({
      user: 'an indie illustrator',
      problem: 'each illustration takes too long',
      solution: 'AI turns a sketch into a finished piece',
    });
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    expect(url).toContain(fakeB64);

    const [endpoint, init] = fetchSpy.mock.calls[0]!;
    expect(endpoint).toBe('/api/llm/image');
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.size).toBe('1024x1024');
    expect(body.response_format).toBe('b64_json');
    expect(body.prompt).toContain('an indie illustrator');
    expect(body.prompt).toContain('AI turns a sketch');
  });
});

describe('TEST-FR-BUILD-IMG-002-C — generateCoverImage failure paths', () => {
  it('throws BuildAssistError("NO_KEY") when the proxy returns 503', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({ error: 'NO_OPENAI_KEY' }),
    } as unknown as Response);
    await expect(generateCoverImage({})).rejects.toMatchObject({
      name: 'BuildAssistError', code: 'NO_KEY',
    });
    await expect(generateCoverImage({})).rejects.toBeInstanceOf(BuildAssistError);
  });

  it('throws BuildAssistError("API") for any other non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({ error: { message: 'upstream blew up' } }),
    } as unknown as Response);
    await expect(generateCoverImage({})).rejects.toMatchObject({
      name: 'BuildAssistError', code: 'API',
    });
  });

  it('throws BuildAssistError("BAD_JSON") when the response has no b64 payload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ data: [] }),
    } as unknown as Response);
    await expect(generateCoverImage({})).rejects.toMatchObject({
      name: 'BuildAssistError', code: 'BAD_JSON',
    });
  });
});
