import { afterEach, describe, expect, it, vi } from 'vitest';
import { RemoteHttpDriver } from '../src';

const fakeFetch = vi.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('RemoteHttpDriver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fakeFetch.mockReset();
  });

  it('maps CRUD to REST endpoints', async () => {
    fakeFetch
      .mockResolvedValueOnce(
        jsonResponse({ id: '1', data: { name: 'a' }, createdAt: 'x', updatedAt: 'x' }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: '1', data: { name: 'a' }, createdAt: 'x', updatedAt: 'x' }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: '1', data: { name: 'a' }, createdAt: 'x', updatedAt: 'x' }]),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: '1', data: { name: 'b' }, createdAt: 'x', updatedAt: 'y' }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    vi.stubGlobal('fetch', fakeFetch);

    const driver = new RemoteHttpDriver({
      baseUrl: 'https://api.example.com',
      headers: { Authorization: 'Bearer t' },
    });
    await driver.create('items', { name: 'a' });
    await driver.read('items', '1');
    await driver.list('items');
    await driver.update('items', '1', { name: 'b' });
    await driver.delete('items', '1');

    expect(fakeFetch).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      'https://api.example.com/items/1',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      'https://api.example.com/items/1',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      'https://api.example.com/items/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
