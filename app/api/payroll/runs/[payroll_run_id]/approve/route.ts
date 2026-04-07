import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payroll_run_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { payroll_run_id } = await context.params;
  return proxyJson(request, `/payroll/runs/${payroll_run_id}/approve`, {
    method: "POST",
  });
}
