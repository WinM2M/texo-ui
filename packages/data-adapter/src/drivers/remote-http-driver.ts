import { StorageError, StorageErrorCode } from '../errors';
import type { ListOptions, StorageDriver, StorageItem } from '../types';

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface RemoteHttpDriverOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  transformRequest?: (request: HttpRequest) => HttpRequest;
  transformResponse?: (response: unknown) => StorageItem[];
}

export class RemoteHttpDriver implements StorageDriver {
  readonly name = 'remote-http';
  private readonly options: RemoteHttpDriverOptions;

  constructor(options: RemoteHttpDriverOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    return;
  }

  async create<T>(collection: string, data: T): Promise<StorageItem<T>> {
    const response = await this.request('POST', `/${collection}`, data);
    return response as StorageItem<T>;
  }

  async read<T>(collection: string, id: string): Promise<StorageItem<T> | null> {
    const response = await this.request('GET', `/${collection}/${id}`);
    if (!response) {
      return null;
    }
    return response as StorageItem<T>;
  }

  async list<T>(collection: string, options?: ListOptions): Promise<StorageItem<T>[]> {
    const params = new URLSearchParams();
    if (options?.filter) {
      params.set('filter', JSON.stringify(options.filter));
    }
    if (options?.sort) {
      params.set('sort', JSON.stringify(options.sort));
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.offset !== undefined) {
      params.set('offset', String(options.offset));
    }

    const suffix = params.size ? `?${params.toString()}` : '';
    const response = await this.request('GET', `/${collection}${suffix}`);
    if (this.options.transformResponse) {
      return this.options.transformResponse(response) as StorageItem<T>[];
    }
    return response as StorageItem<T>[];
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<StorageItem<T>> {
    const response = await this.request('PATCH', `/${collection}/${id}`, data);
    return response as StorageItem<T>;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    await this.request('DELETE', `/${collection}/${id}`);
    return true;
  }

  async dropCollection(collection: string): Promise<void> {
    await this.request('DELETE', `/${collection}`);
  }

  async dispose(): Promise<void> {
    return;
  }

  private async request(
    method: HttpRequest['method'],
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const request: HttpRequest = {
      method,
      url: `${this.options.baseUrl.replace(/\/$/, '')}${path}`,
      headers: {
        'content-type': 'application/json',
        ...(this.options.headers ?? {}),
      },
      body,
    };

    const finalRequest = this.options.transformRequest
      ? this.options.transformRequest(request)
      : request;

    let response: Response;
    try {
      response = await fetch(finalRequest.url, {
        method: finalRequest.method,
        headers: finalRequest.headers,
        body: finalRequest.body === undefined ? undefined : JSON.stringify(finalRequest.body),
      });
    } catch (error) {
      throw new StorageError(
        'Remote HTTP network failure.',
        StorageErrorCode.NETWORK_ERROR,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new StorageError(
        `Remote HTTP request failed with status ${response.status}.`,
        StorageErrorCode.NETWORK_ERROR,
        this.name,
      );
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }
}
