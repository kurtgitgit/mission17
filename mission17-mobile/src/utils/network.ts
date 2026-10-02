export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const PROOF_SUBMISSION_TIMEOUT_MS = 120_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super('The request took too long. Please try again.');
    this.name = 'RequestTimeoutError';
  }
}

export class ApiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

/**
 * Adds a conservative timeout to remote requests. Callers still decide whether a
 * retry is safe; resident submissions must never be automatically re-sent.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (controller.signal.aborted) throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Reads an API response without assuming every proxy/server error is JSON.
 * This prevents HTML gateway responses and empty bodies from being mislabeled
 * as device network failures.
 */
export async function readApiJson<T extends Record<string, unknown> = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const rawBody = await response.text();

  if (!rawBody) {
    if (response.ok) return {} as T;
    throw new ApiResponseError(`The server returned an empty response (HTTP ${response.status}). Please try again.`);
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    if (response.status === 413) {
      throw new ApiResponseError('The photo is too large. Please retake it and try again.');
    }
    if (response.status >= 500) {
      throw new ApiResponseError('The server is temporarily unavailable. Please try again shortly.');
    }
    throw new ApiResponseError(`The server returned an unreadable response (HTTP ${response.status}). Please try again.`);
  }
}

/**
 * Fetches a private history collection without allowing a stale HTTP cache to
 * turn an empty list into a misleading 304/error screen. A conditional 304 is
 * safe to retry because this helper is restricted to read-only GET requests.
 */
async function fetchPrivateResponse(
  url: string,
  authHeaders: Record<string, string>,
): Promise<Response> {
  const headers = {
    ...authHeaders,
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  };

  let response = await fetchWithTimeout(url, { headers, cache: 'no-store' });
  if (response.status === 304) {
    const separator = url.includes('?') ? '&' : '?';
    response = await fetchWithTimeout(`${url}${separator}refresh=${Date.now()}`, {
      headers,
      cache: 'no-store',
    });
  }

  return response;
}

/** Fetches one private JSON resource without reusing a conditional HTTP cache. */
export async function fetchPrivateJson<T>(
  url: string,
  authHeaders: Record<string, string>,
): Promise<T> {
  const response = await fetchPrivateResponse(url, authHeaders);
  const data = await readApiJson<any>(response);

  if (!response.ok) {
    throw new ApiResponseError(data?.message || `The request failed (HTTP ${response.status}).`);
  }

  return data as T;
}

export async function fetchPrivateCollection<T>(
  url: string,
  authHeaders: Record<string, string>,
): Promise<T[]> {
  const response = await fetchPrivateResponse(url, authHeaders);

  if (response.status === 204) return [];

  const data = await readApiJson<any>(response);
  if (!response.ok) {
    throw new ApiResponseError(data?.message || `The history request failed (HTTP ${response.status}).`);
  }
  if (!Array.isArray(data)) {
    throw new ApiResponseError('The server returned an invalid history response. Please try again.');
  }

  return data as T[];
}

export function getFriendlyNetworkMessage(error: unknown, fallback = 'Could not connect. Please check your internet connection and try again.') {
  if (error instanceof RequestTimeoutError) return error.message;
  if (error instanceof ApiResponseError || (error instanceof Error && error.name === 'ProofImageError')) {
    return error.message;
  }
  if (error instanceof Error) {
    if (/must be signed in|session expired|auth\/user-token-expired|auth\/invalid-user-token/i.test(error.message)) {
      return 'Your session expired. Please sign in again, then resubmit your proof.';
    }
    if (/network request failed|failed to fetch|auth\/network-request-failed|network/i.test(error.message)) {
      return 'No internet connection. Please check your connection and try again.';
    }
  }
  return fallback;
}
