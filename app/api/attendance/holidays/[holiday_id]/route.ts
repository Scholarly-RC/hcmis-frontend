import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    holiday_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { holiday_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/attendance/holidays/${holiday_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { holiday_id } = await context.params;

  return proxyJson(request, `/attendance/holidays/${holiday_id}`, {
    method: "DELETE",
  });
}
