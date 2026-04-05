import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    position_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { position_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/payroll/positions/${position_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { position_id } = await context.params;
  return proxyJson(request, `/payroll/positions/${position_id}`, {
    method: "DELETE",
  });
}
