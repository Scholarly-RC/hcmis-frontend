import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    compensation_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { compensation_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/payroll/fixed-compensations/${compensation_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { compensation_id } = await context.params;
  return proxyJson(request, `/payroll/fixed-compensations/${compensation_id}`, {
    method: "DELETE",
  });
}
