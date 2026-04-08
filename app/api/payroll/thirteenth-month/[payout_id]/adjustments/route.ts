import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payout_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { payout_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/payroll/thirteenth-month/${payout_id}/adjustments`,
    {
      method: "POST",
      body,
    },
  );
}
