import {
  buildBackendUrl,
  createBackendTimeoutSignal,
  readBackendJson,
} from "@/lib/backend";

type BackendFetchOptions = {
  token: string;
  pathname: string;
  fallbackMessage: string;
  init?: RequestInit;
};

export async function fetchBackendJsonWithAuth<T>({
  token,
  pathname,
  fallbackMessage,
  init,
}: BackendFetchOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildBackendUrl(pathname), {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
    signal: init?.signal ?? createBackendTimeoutSignal(),
  });

  const payload = await readBackendJson<Partial<T> & { detail?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(payload?.detail ?? fallbackMessage);
  }

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  return payload as T;
}
