import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createClearedAuthCookieOptions,
} from "@/lib/auth-server";

function createLogoutResponse(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  response.cookies.set(AUTH_COOKIE_NAME, "", createClearedAuthCookieOptions());
  return response;
}

export async function POST(request: NextRequest) {
  return createLogoutResponse(request);
}

export async function GET(request: NextRequest) {
  return createLogoutResponse(request);
}
