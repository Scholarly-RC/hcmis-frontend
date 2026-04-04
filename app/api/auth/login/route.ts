import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  loginWithBackend,
} from "@/lib/auth-server";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { detail: "Invalid login request." },
      { status: 400 },
    );
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { detail: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const auth = await loginWithBackend(body.email, body.password);
    const response = NextResponse.json({
      user: auth.user,
      must_change_password: auth.user.must_change_password,
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      auth.access_token,
      getAuthCookieOptions(auth.access_token),
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";

    return NextResponse.json(
      { detail: message },
      {
        status:
          message === "Incorrect email or password." ||
          message ===
            "Temporary password has expired. Please contact HR for reset."
            ? 401
            : 502,
      },
    );
  }
}
