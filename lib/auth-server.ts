export { AUTH_COOKIE_NAME } from "@/constants/auth";

import { buildBackendUrl, readBackendJson } from "@/lib/backend";
import type {
  AuthLoginResponse,
  AuthUser,
  AuthUserChangePassword,
  AuthUserProfileUpdate,
} from "@/types/auth";

const LOGIN_BACKEND_TIMEOUT_MS = 10_000;
const LOGIN_BACKEND_RETRY_DELAY_MS = 300;
const LOGIN_BACKEND_MAX_ATTEMPTS = 2;

export class BackendLoginError extends Error {
  kind: "upstream_timeout" | "upstream_network" | "upstream_http" | "unknown";

  constructor(kind: BackendLoginError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchLoginWithTimeout(
  identifier: string,
  password: string,
  requestId?: string,
) {
  const timeoutSignal = AbortSignal.timeout(LOGIN_BACKEND_TIMEOUT_MS);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requestId) {
    headers["X-Request-Id"] = requestId;
  }

  return fetch(buildBackendUrl("/auth/login"), {
    method: "POST",
    headers,
    body: JSON.stringify({ identifier, password }),
    cache: "no-store",
    signal: timeoutSignal,
  });
}

function getTokenExpiryDate(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return undefined;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      exp?: unknown;
    };

    return typeof decoded.exp === "number"
      ? new Date(decoded.exp * 1000)
      : undefined;
  } catch {
    return undefined;
  }
}

export async function loginWithBackend(
  identifier: string,
  password: string,
  requestId?: string,
): Promise<AuthLoginResponse> {
  let response: Response | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= LOGIN_BACKEND_MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetchLoginWithTimeout(identifier, password, requestId);
      break;
    } catch (error) {
      lastError = error;
      const timedOut =
        error instanceof DOMException && error.name === "TimeoutError";
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      const isNetworkError = error instanceof TypeError;
      const shouldRetry =
        attempt < LOGIN_BACKEND_MAX_ATTEMPTS &&
        (timedOut || aborted || isNetworkError);

      if (shouldRetry) {
        await sleep(LOGIN_BACKEND_RETRY_DELAY_MS);
        continue;
      }

      if (timedOut || aborted) {
        throw new BackendLoginError(
          "upstream_timeout",
          "Authentication service timed out.",
        );
      }

      if (isNetworkError) {
        throw new BackendLoginError(
          "upstream_network",
          "Authentication service is unreachable.",
        );
      }

      throw new BackendLoginError("unknown", "Unable to sign in.");
    }
  }

  if (!response) {
    if (lastError instanceof BackendLoginError) {
      throw lastError;
    }
    throw new BackendLoginError("unknown", "Unable to sign in.");
  }

  const payload = await readBackendJson<
    Partial<AuthLoginResponse> & { detail?: string }
  >(response);

  if (!response.ok) {
    throw new BackendLoginError(
      "upstream_http",
      payload?.detail ?? "Unable to sign in.",
    );
  }

  if (!payload?.access_token || !payload?.user) {
    throw new BackendLoginError("unknown", "Unable to sign in.");
  }

  return payload as AuthLoginResponse;
}

export async function fetchCurrentUser(
  token: string,
): Promise<AuthUser | null> {
  const response = await fetch(buildBackendUrl("/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return readBackendJson<AuthUser>(response);
}

export async function updateCurrentUserProfile(
  token: string,
  payload: AuthUserProfileUpdate,
): Promise<AuthUser> {
  const response = await fetch(buildBackendUrl("/profile/me"), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responsePayload = await readBackendJson<
    Partial<AuthUser> & { detail?: string }
  >(response);

  if (!response.ok) {
    throw new Error(responsePayload?.detail ?? "Unable to update profile.");
  }

  if (!responsePayload) {
    throw new Error("Unable to update profile.");
  }

  return responsePayload as AuthUser;
}

export async function changeCurrentUserPassword(
  token: string,
  payload: AuthUserChangePassword,
): Promise<void> {
  const response = await fetch(buildBackendUrl("/auth/change-password"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responsePayload = await readBackendJson<{ detail?: string }>(response);
  if (!response.ok) {
    throw new Error(
      responsePayload?.detail ?? "Unable to update your password.",
    );
  }
}

export function getAuthCookieOptions(token: string) {
  const expires = getTokenExpiryDate(token);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

export function createClearedAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };
}
