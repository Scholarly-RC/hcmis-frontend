import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    schedule_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { schedule_id } = await context.params;

  return proxyJson(request, `/attendance/shift-assignments/${schedule_id}`, {
    method: "DELETE",
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { schedule_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/attendance/shift-assignments/${schedule_id}`, {
    method: "PATCH",
    body,
  });
}
