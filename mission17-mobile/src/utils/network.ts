export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

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

export function getFriendlyNetworkMessage(error: unknown, fallback = 'Could not connect. Please check your internet connection and try again.') {
  if (error instanceof RequestTimeoutError) return error.message;
  if (error instanceof ApiResponseError || (error instanceof Error && error.name === 'ProofImageError')) {
    return error.message;
  }
  if (error instanceof Error && /network request failed|failed to fetch|network/i.test(error.message)) {
    return 'No internet connection. Please check your connection and try again.';
  }
  return fallback;
}
