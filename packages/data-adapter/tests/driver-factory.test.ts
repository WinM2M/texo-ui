import { describe, expect, it } from 'vitest';
import {
  createDriver,
  GoogleDriveDriver,
  LocalStorageDriver,
  NotionDriver,
  RemoteHttpDriver,
} from '../src';

describe('createDriver', () => {
  it('creates local-storage driver', () => {
    const driver = createDriver('local-storage', {});
    expect(driver).toBeInstanceOf(LocalStorageDriver);
  });

  it('creates google-drive driver', () => {
    const driver = createDriver('google-drive', { auth: { clientId: 'id' } });
    expect(driver).toBeInstanceOf(GoogleDriveDriver);
  });

  it('creates notion driver', () => {
    const driver = createDriver('notion', { token: 't', proxyUrl: 'https://proxy' });
    expect(driver).toBeInstanceOf(NotionDriver);
  });

  it('creates remote-http driver', () => {
    const driver = createDriver('remote-http', { baseUrl: 'https://api.example.com' });
    expect(driver).toBeInstanceOf(RemoteHttpDriver);
  });
});
