import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    request_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { request_id } = await context.params;
  const body = await request.text();

  return proxyJson(
    request,
    `/special-requests/official-business/${request_id}/respond`,
    {
      method: "POST",
      body,
    },
  );
}
