import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleDriveDriver } from '../src';

const fakeFetch = vi.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GoogleDriveDriver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fakeFetch.mockReset();
  });

  it('creates appData file and performs CRUD using Drive API', async () => {
    fakeFetch
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'file_1' }))
      .mockResolvedValue(jsonResponse([]));

    vi.stubGlobal('fetch', fakeFetch);

    const driver = new GoogleDriveDriver({ auth: { clientId: 'google-client' } });
    await driver.initialize();
    await driver.create('expenses', { amount: 10 });

    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining('/drive/v3/files?spaces=appDataFolder'),
      expect.any(Object),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining('/drive/v3/files'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload/drive/v3/files/file_1'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
