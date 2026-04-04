import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, changeCurrentUserPassword } from "@/lib/auth-server";
import type { AuthUserChangePassword } from "@/types/auth";

type ChangePasswordRequestBody = {
  current_password?: unknown;
  new_password?: unknown;
};

function normalizeBody(
  body: ChangePasswordRequestBody,
): AuthUserChangePassword {
  if (typeof body.new_password !== "string") {
    throw new Error("New password is required.");
  }

  return {
    ...(typeof body.current_password === "string"
      ? { current_password: body.current_password }
      : {}),
    new_password: body.new_password,
  };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { detail: "You must be signed in to update your password." },
      { status: 401 },
    );
  }

  let body: ChangePasswordRequestBody;
  try {
    body = (await request.json()) as ChangePasswordRequestBody;
  } catch {
    return NextResponse.json(
      { detail: "Invalid password change request." },
      { status: 400 },
    );
  }

  try {
    await changeCurrentUserPassword(token, normalizeBody(body));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update your password.";

    return NextResponse.json(
      { detail: message },
      {
        status: message === "Could not validate credentials." ? 401 : 400,
      },
    );
  }
}
