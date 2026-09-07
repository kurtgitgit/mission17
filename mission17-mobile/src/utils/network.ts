export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super('The request took too long. Please try again.');
    this.name = 'RequestTimeoutError';
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

export function getFriendlyNetworkMessage(error: unknown, fallback = 'Could not connect. Please check your internet connection and try again.') {
  if (error instanceof RequestTimeoutError) return error.message;
  if (error instanceof Error && /network request failed|failed to fetch|network/i.test(error.message)) {
    return 'No internet connection. Please check your connection and try again.';
  }
  return fallback;
}
