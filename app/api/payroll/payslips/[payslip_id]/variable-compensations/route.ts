import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payslip_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { payslip_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/payroll/payslips/${payslip_id}/variable-compensations`,
    {
      method: "POST",
      body,
    },
  );
}
