import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    run_input_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { run_input_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/payroll/run-inputs/${run_input_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { run_input_id } = await context.params;
  return proxyJson(request, `/payroll/run-inputs/${run_input_id}`, {
    method: "DELETE",
  });
}
