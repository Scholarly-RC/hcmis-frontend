import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payslip_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { payslip_id } = await context.params;
  return proxyJson(request, `/payroll/payslips/${payslip_id}/release-toggle`, {
    method: "POST",
  });
}
