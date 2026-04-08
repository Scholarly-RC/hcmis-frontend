import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    payout_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { payout_id } = await context.params;
  return proxyJson(request, `/payroll/thirteenth-month/${payout_id}/release`, {
    method: "POST",
  });
}
