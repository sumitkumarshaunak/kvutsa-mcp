import type { CitySearchResponse, ListingSearchParams, ListingSearchResponse } from '../types/index.js';
import { getMcpContext } from './requestContext.js';

/** The only module that calls kvutsa-backend. Tools use these methods, never fetch. */
export interface KvutsaBackendClient {
  searchCities(query: string): Promise<CitySearchResponse>;
  searchListings(params: ListingSearchParams): Promise<ListingSearchResponse>;
}

/** kvutsa-backend answered 4xx. `code` is its `error` / `message` field. */
export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`kvutsa-backend answered ${status}${code ? ` (${code})` : ''}`);
    this.name = 'BackendError';
  }
}

/** kvutsa-backend could not be reached, timed out, or answered 5xx. */
export class BackendUnavailableError extends Error {
  constructor(cause: unknown) {
    super('kvutsa-backend is unavailable', { cause });
    this.name = 'BackendUnavailableError';
  }
}

type Query = Record<string, string | number | undefined>;

function errorCodeOf(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.error === 'string') return b.error;
    if (typeof b.message === 'string') return b.message;
  }
  return null;
}

/**
 * Audit headers, named as getstatus-mcp sends them: x-source = channel, x-mcp-tool, x-mcp-client.
 * The channel is not 'external_client': getstatus-backend uses that for api-key-authenticated
 * clients, and this server has no login.
 */
function auditHeaders(): Record<string, string> {
  const ctx = getMcpContext();
  const headers: Record<string, string> = { 'x-source': 'kvutsa_public' };
  if (ctx?.toolName) headers['x-mcp-tool'] = ctx.toolName;
  if (ctx?.clientName) headers['x-mcp-client'] = ctx.clientName;
  return headers;
}

export function createKvutsaBackendClient(options: { baseUrl: string; timeoutMs: number; fetchImpl?: typeof fetch }): KvutsaBackendClient {
  const doFetch = options.fetchImpl ?? fetch;

  async function get<T>(path: string, query?: Query): Promise<T> {
    const url = new URL(options.baseUrl + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }

    let res: Response;
    try {
      res = await doFetch(url, {
        headers: { accept: 'application/json', ...auditHeaders() },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
    } catch (err) {
      throw new BackendUnavailableError(err);
    }

    const body: unknown = await res.json().catch(() => null);
    if (res.status >= 500) throw new BackendUnavailableError(new BackendError(res.status, errorCodeOf(body)));
    if (!res.ok) throw new BackendError(res.status, errorCodeOf(body));
    return body as T;
  }

  return {
    searchCities: (query) => get('/cities/public', { q: query }),
    searchListings: ({ cityCode, page, limit, sort }) => get('/listings', { cityCode, page, limit, sort }),
  };
}
