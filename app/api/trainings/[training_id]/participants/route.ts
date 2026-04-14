import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{ training_id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { training_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/trainings/${training_id}/participants`, {
    method: "PUT",
    body,
  });
}
