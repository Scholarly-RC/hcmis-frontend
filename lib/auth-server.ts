export { AUTH_COOKIE_NAME } from "@/lib/auth";

import type {
  AuthLoginResponse,
  AuthUser,
  AuthUserProfileUpdate,
} from "@/lib/auth";
import { buildBackendUrl, readBackendJson } from "@/lib/backend";

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
  email: string,
  password: string,
): Promise<AuthLoginResponse> {
  const response = await fetch(buildBackendUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const payload = await readBackendJson<
    Partial<AuthLoginResponse> & { detail?: string }
  >(response);

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Unable to sign in.");
  }

  if (!payload?.access_token || !payload?.user) {
    throw new Error("Unable to sign in.");
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
