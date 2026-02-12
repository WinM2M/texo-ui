import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotionDriver } from '../src';

const fakeFetch = vi.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('NotionDriver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fakeFetch.mockReset();
  });

  it('creates database and page through notion API', async () => {
    fakeFetch
      .mockResolvedValueOnce(jsonResponse({ id: 'db_1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'page_1' }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }));

    vi.stubGlobal('fetch', fakeFetch);

    const driver = new NotionDriver({ token: 'secret', proxyUrl: 'https://proxy.example.com' });
    await driver.initialize();
    await driver.create('todos', { text: 'a' });
    const list = await driver.list('todos');
    expect(list).toEqual([]);

    expect(fakeFetch).toHaveBeenCalledWith(
      'https://proxy.example.com/v1/databases',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      'https://proxy.example.com/v1/pages',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
