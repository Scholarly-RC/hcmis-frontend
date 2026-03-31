import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payslip_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { payslip_id } = await context.params;
  return proxyJson(request, `/payroll/payslips/${payslip_id}/summary`);
}
