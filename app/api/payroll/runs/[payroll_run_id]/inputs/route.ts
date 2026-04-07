import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payroll_run_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { payroll_run_id } = await context.params;
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/payroll/runs/${payroll_run_id}/inputs?${query}`
      : `/payroll/runs/${payroll_run_id}/inputs`;
  return proxyJson(request, pathname);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { payroll_run_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/payroll/runs/${payroll_run_id}/inputs`, {
    method: "POST",
    body,
  });
}
