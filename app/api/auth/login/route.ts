import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  BackendLoginError,
  getAuthCookieOptions,
  loginWithBackend,
} from "@/lib/auth-server";

type LoginRequestBody = {
  identifier?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    console.warn("[auth-login] invalid-json", { requestId });
    return NextResponse.json(
      { detail: "Invalid login request." },
      { status: 400 },
    );
  }

  const identifier =
    typeof body.identifier === "string"
      ? body.identifier
      : typeof body.email === "string"
        ? body.email
        : null;

  if (typeof body.password !== "string" || identifier === null) {
    console.warn("[auth-login] invalid-payload", { requestId });
    return NextResponse.json(
      { detail: "Email/Username and password are required." },
      { status: 400 },
    );
  }

  try {
    const auth = await loginWithBackend(identifier, body.password, requestId);
    const response = NextResponse.json({
      user: auth.user,
      must_change_password: auth.user.must_change_password,
    });
    response.headers.set("X-Request-Id", requestId);

    response.cookies.set(
      AUTH_COOKIE_NAME,
      auth.access_token,
      getAuthCookieOptions(auth.access_token),
    );

    console.info("[auth-login] success", {
      requestId,
      durationMs: Date.now() - startedAt,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    const isKnownUpstreamError = error instanceof BackendLoginError;
    const statusCode = (() => {
      if (!isKnownUpstreamError) {
        return 502;
      }

      if (error.kind === "upstream_timeout") {
        return 504;
      }

      if (error.kind === "upstream_network") {
        return 502;
      }

      if (
        message === "Incorrect email/username or password." ||
        message ===
          "Temporary password has expired. Please contact HR for reset."
      ) {
        return 401;
      }

      if (error.kind === "upstream_http") {
        return 502;
      }

      return 502;
    })();

    console.error("[auth-login] failure", {
      requestId,
      durationMs: Date.now() - startedAt,
      statusCode,
      kind: isKnownUpstreamError ? error.kind : "unknown",
      message,
    });

    const response = NextResponse.json(
      { detail: message },
      { status: statusCode },
    );
    response.headers.set("X-Request-Id", requestId);
    return response;
  }
}
