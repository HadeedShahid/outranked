type QueryParams = Record<string, string | number | boolean | undefined>;

export class HttpError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function buildPath(path: string, params?: QueryParams): string {
  if (!params) return path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Single low-level HTTP class every client-side request goes through.
 * Feature code should not call `fetch` directly — go through an
 * api-client module (e.g. lib/api-client/boards.ts) that wraps this.
 */
class HttpClient {
  private async request<T>(
    method: string,
    path: string,
    options: { params?: QueryParams; body?: unknown } = {}
  ): Promise<T> {
    const response = await fetch(buildPath(path, options.params), {
      method,
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : undefined;

    if (!response.ok) {
      const message = (data as { error?: string } | undefined)?.error ?? response.statusText;
      throw new HttpError(response.status, message, data);
    }

    return data as T;
  }

  get<T>(path: string, params?: QueryParams) {
    return this.request<T>("GET", path, { params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T>(path: string, params?: QueryParams) {
    return this.request<T>("DELETE", path, { params });
  }
}

export const httpClient = new HttpClient();
