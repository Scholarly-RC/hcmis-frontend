import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { buildBackendUrl, readBackendJson } from "@/lib/backend";

function getAuthToken(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function proxyJson(
  request: NextRequest,
  pathname: string,
  init: RequestInit = {},
) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { detail: "You must be signed in to access this resource." },
      { status: 401 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildBackendUrl(pathname), {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await readBackendJson<unknown>(response);

  if (!response.ok) {
    return NextResponse.json(payload ?? { detail: "Request failed." }, {
      status: response.status,
    });
  }

  return NextResponse.json(payload);
}
