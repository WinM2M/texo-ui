import type { StorageDriver } from '../types';
import { GoogleDriveDriver, type GoogleDriveDriverOptions } from './google-drive';
import { LocalStorageDriver, type LocalStorageDriverOptions } from './local-storage-driver';
import { NotionDriver, type NotionDriverOptions } from './notion';
import { RemoteHttpDriver, type RemoteHttpDriverOptions } from './remote-http-driver';

export type DriverType = 'local-storage' | 'google-drive' | 'notion' | 'remote-http';

export function createDriver(type: DriverType, options: unknown): StorageDriver {
  switch (type) {
    case 'local-storage':
      return new LocalStorageDriver(options as LocalStorageDriverOptions);
    case 'google-drive':
      return new GoogleDriveDriver(options as GoogleDriveDriverOptions);
    case 'notion':
      return new NotionDriver(options as NotionDriverOptions);
    case 'remote-http':
      return new RemoteHttpDriver(options as RemoteHttpDriverOptions);
    default:
      throw new Error(`Unsupported driver type: ${String(type)}`);
  }
}
