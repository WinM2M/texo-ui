import { StorageError, StorageErrorCode } from '../../errors';
import type { ListOptions, StorageDriver, StorageItem } from '../../types';
import { GoogleAuthManager, type GoogleAuthConfig } from './auth';

export interface GoogleDriveDriverOptions {
  auth: GoogleAuthConfig;
  fileNamePattern?: string;
}

function patternName(pattern: string, collection: string): string {
  return pattern.replace('{collection}', collection);
}

export class GoogleDriveDriver implements StorageDriver {
  readonly name = 'google-drive';
  private readonly authManager: GoogleAuthManager;
  private readonly fileNamePattern: string;
  private readonly fileIdCache = new Map<string, string>();

  constructor(options: GoogleDriveDriverOptions) {
    this.authManager = new GoogleAuthManager(options.auth);
    this.fileNamePattern = options.fileNamePattern ?? '{collection}.json';
  }

  async initialize(): Promise<void> {
    if (!this.authManager.isAuthenticated()) {
      await this.authManager.signIn();
    }
  }

  async create<T>(collection: string, data: T): Promise<StorageItem<T>> {
    const items = await this.list<T>(collection);
    const now = new Date().toISOString();
    const item: StorageItem<T> = {
      id: crypto.randomUUID(),
      data,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    await this.writeCollection(collection, items);
    return item;
  }

  async read<T>(collection: string, id: string): Promise<StorageItem<T> | null> {
    const items = await this.list<T>(collection);
    return items.find((item) => item.id === id) ?? null;
  }

  async list<T>(collection: string, options?: ListOptions): Promise<StorageItem<T>[]> {
    void options;
    const file = await this.readCollection<T>(collection);
    return file;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<StorageItem<T>> {
    const items = await this.list<T>(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new StorageError('Google Drive item not found.', StorageErrorCode.NOT_FOUND, this.name);
    }
    const current = items[index];
    const next: StorageItem<T> = {
      ...current,
      data: {
        ...(current.data as Record<string, unknown>),
        ...(data as Record<string, unknown>),
      } as T,
      updatedAt: new Date().toISOString(),
    };
    items[index] = next;
    await this.writeCollection(collection, items);
    return next;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const items = await this.list(collection);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) {
      return false;
    }
    await this.writeCollection(collection, next);
    return true;
  }

  async dropCollection(collection: string): Promise<void> {
    const fileId = await this.ensureFile(collection);
    await this.fetchDrive(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
    });
    this.fileIdCache.delete(collection);
  }

  async dispose(): Promise<void> {
    await this.authManager.signOut();
  }

  private async readCollection<T>(collection: string): Promise<StorageItem<T>[]> {
    const fileId = await this.ensureFile(collection);
    const response = await this.fetchDrive(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    );
    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new StorageError(
        'Failed to read Google Drive AppData file.',
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }
    const payload = await response.text();
    if (!payload) {
      return [];
    }
    return JSON.parse(payload) as StorageItem<T>[];
  }

  private async writeCollection<T>(collection: string, items: StorageItem<T>[]): Promise<void> {
    const fileId = await this.ensureFile(collection);
    const response = await this.fetchDrive(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(items),
      },
    );

    if (!response.ok) {
      throw new StorageError(
        'Failed to write Google Drive AppData file.',
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }
  }

  private async ensureFile(collection: string): Promise<string> {
    const cached = this.fileIdCache.get(collection);
    if (cached) {
      return cached;
    }

    const fileName = patternName(this.fileNamePattern, collection);
    const listResponse = await this.fetchDrive(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${encodeURIComponent(fileName)}'&fields=files(id,name)`,
    );
    if (!listResponse.ok) {
      throw new StorageError(
        'Failed listing Google Drive AppData files.',
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }
    const listJson = (await listResponse.json()) as { files?: Array<{ id: string; name: string }> };
    const existing = listJson.files?.find((file) => file.name === fileName);
    if (existing) {
      this.fileIdCache.set(collection, existing.id);
      return existing.id;
    }

    const createResponse = await this.fetchDrive('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: fileName, parents: ['appDataFolder'] }),
    });
    if (!createResponse.ok) {
      throw new StorageError(
        'Failed creating Google Drive AppData file.',
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }
    const created = (await createResponse.json()) as { id: string };
    this.fileIdCache.set(collection, created.id);
    return created.id;
  }

  private async fetchDrive(input: string, init?: RequestInit): Promise<Response> {
    const token = this.authManager.getAccessToken();
    if (!token) {
      throw new StorageError(
        'Google Drive auth required.',
        StorageErrorCode.AUTH_REQUIRED,
        this.name,
      );
    }

    return fetch(input, {
      ...(init ?? {}),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  }
}
