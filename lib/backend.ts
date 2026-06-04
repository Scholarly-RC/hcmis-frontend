const DEFAULT_BACKEND_URL = "http://localhost:8000";
const DEFAULT_BACKEND_FETCH_TIMEOUT_MS = 10_000;

function getBackendBaseUrl() {
  return process.env.HCMIS_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export function buildBackendUrl(pathname: string) {
  return new URL(pathname, getBackendBaseUrl()).toString();
}

export function createBackendTimeoutSignal(
  timeoutMs: number = DEFAULT_BACKEND_FETCH_TIMEOUT_MS,
) {
  return AbortSignal.timeout(timeoutMs);
}

export async function readBackendJson<T>(
  response: Response,
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
