import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/constants/auth";
import { buildBackendUrl } from "@/lib/backend";

type RouteContext = {
  params: Promise<{
    resource_id: string;
  }>;
};

function getAuthToken(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const token = getAuthToken(request);
  if (!token) {
    return Response.json(
      { detail: "You must be signed in to access this resource." },
      { status: 401 },
    );
  }

  const { resource_id } = await context.params;
  const response = await fetch(
    buildBackendUrl(`/performance/shared-resources/${resource_id}/download`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return Response.json(payload ?? { detail: "Request failed." }, {
      status: response.status,
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  });
}
