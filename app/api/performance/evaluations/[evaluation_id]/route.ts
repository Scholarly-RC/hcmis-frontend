import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    evaluation_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { evaluation_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/performance/evaluations/${evaluation_id}`, {
    method: "PATCH",
    body,
  });
}
