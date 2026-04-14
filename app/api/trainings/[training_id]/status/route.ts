import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{ training_id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { training_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/trainings/${training_id}/status`, {
    method: "PATCH",
    body,
  });
}
