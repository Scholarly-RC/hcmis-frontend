import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/constants/auth";
import { buildBackendUrl } from "@/lib/backend";

function getAuthToken(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function POST(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return Response.json(
      { detail: "You must be signed in to access this resource." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const response = await fetch(
    buildBackendUrl("/performance/shared-resources/upload"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return Response.json(payload ?? { detail: "Request failed." }, {
      status: response.status,
    });
  }

  return Response.json(payload);
}
