import { StorageError, StorageErrorCode } from '../../errors';
import type { ListOptions, StorageDriver, StorageItem } from '../../types';

export interface NotionDriverOptions {
  token: string;
  proxyUrl?: string;
}

interface NotionCollectionMeta {
  collection: string;
  databaseId: string;
}

export class NotionDriver implements StorageDriver {
  readonly name = 'notion';
  private readonly token: string;
  private readonly proxyUrl?: string;
  private readonly collectionMap = new Map<string, string>();

  constructor(options: NotionDriverOptions) {
    this.token = options.token;
    this.proxyUrl = options.proxyUrl;
  }

  async initialize(): Promise<void> {
    if (!this.token) {
      throw new StorageError(
        'Notion token is required.',
        StorageErrorCode.AUTH_REQUIRED,
        this.name,
      );
    }
  }

  async create<T>(collection: string, data: T): Promise<StorageItem<T>> {
    const databaseId = await this.ensureDatabase(collection);
    const now = new Date().toISOString();
    const item: StorageItem<T> = {
      id: crypto.randomUUID(),
      data,
      createdAt: now,
      updatedAt: now,
    };

    await this.request('/v1/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: this.toNotionProperties(item),
      }),
    });
    return item;
  }

  async read<T>(collection: string, id: string): Promise<StorageItem<T> | null> {
    const items = await this.list<T>(collection);
    return items.find((item) => item.id === id) ?? null;
  }

  async list<T>(collection: string, options?: ListOptions): Promise<StorageItem<T>[]> {
    void options;
    const databaseId = await this.ensureDatabase(collection);
    const response = await this.request(`/v1/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100 }),
    });
    const json = (await response.json()) as {
      results?: Array<{ properties?: Record<string, unknown> }>;
    };
    const rows = json.results ?? [];
    return rows
      .map((row) => this.fromNotionProperties<T>(row.properties ?? {}))
      .filter((item): item is StorageItem<T> => item !== null);
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<StorageItem<T>> {
    const current = await this.read<T>(collection, id);
    if (!current) {
      throw new StorageError('Notion item not found.', StorageErrorCode.NOT_FOUND, this.name);
    }
    const next: StorageItem<T> = {
      ...current,
      data: {
        ...(current.data as Record<string, unknown>),
        ...(data as Record<string, unknown>),
      } as T,
      updatedAt: new Date().toISOString(),
    };

    await this.request(`/v1/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: this.toNotionProperties(next) }),
    });
    return next;
  }

  async delete(_collection: string, id: string): Promise<boolean> {
    await this.request(`/v1/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: true }),
    });
    return true;
  }

  async dropCollection(collection: string): Promise<void> {
    this.collectionMap.delete(collection);
  }

  async dispose(): Promise<void> {
    return;
  }

  private async ensureDatabase(collection: string): Promise<string> {
    const cached = this.collectionMap.get(collection);
    if (cached) {
      return cached;
    }
    const response = await this.request('/v1/databases', {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'workspace', workspace: true },
        title: [{ type: 'text', text: { content: collection } }],
        properties: {
          id: { rich_text: {} },
          data: { rich_text: {} },
          createdAt: { date: {} },
          updatedAt: { date: {} },
        },
      }),
    });
    const json = (await response.json()) as NotionCollectionMeta & { id?: string };
    const id = json.id ?? collection;
    this.collectionMap.set(collection, id);
    return id;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const base = this.proxyUrl ?? 'https://api.notion.com';
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      throw new StorageError(
        `Notion API request failed with status ${response.status}.`,
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }
    return response;
  }

  private toNotionProperties<T>(item: StorageItem<T>): Record<string, unknown> {
    return {
      id: {
        rich_text: [{ text: { content: item.id } }],
      },
      data: {
        rich_text: [{ text: { content: JSON.stringify(item.data) } }],
      },
      createdAt: {
        date: { start: item.createdAt },
      },
      updatedAt: {
        date: { start: item.updatedAt },
      },
    };
  }

  private fromNotionProperties<T>(properties: Record<string, unknown>): StorageItem<T> | null {
    const id = this.extractRichText(properties.id);
    const dataRaw = this.extractRichText(properties.data);
    const createdAt = this.extractDate(properties.createdAt);
    const updatedAt = this.extractDate(properties.updatedAt);
    if (!id || !dataRaw || !createdAt || !updatedAt) {
      return null;
    }

    return {
      id,
      data: JSON.parse(dataRaw) as T,
      createdAt,
      updatedAt,
    };
  }

  private extractRichText(value: unknown): string | null {
    const richText = (value as { rich_text?: Array<{ plain_text?: string }> }).rich_text;
    if (!Array.isArray(richText) || richText.length === 0) {
      return null;
    }
    return richText[0].plain_text ?? null;
  }

  private extractDate(value: unknown): string | null {
    return (value as { date?: { start?: string } }).date?.start ?? null;
  }
}
