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
      { detail: "You must be signed in to update your profile." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const response = await fetch(buildBackendUrl("/profile/me/photo"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return Response.json(payload ?? { detail: "Request failed." }, {
      status: response.status,
    });
  }

  return Response.json(payload);
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return new Response(null, { status: 401 });
  }

  const response = await fetch(buildBackendUrl("/profile/me/photo"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return new Response(null, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
