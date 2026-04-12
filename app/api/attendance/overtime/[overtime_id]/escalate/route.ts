import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    overtime_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { overtime_id } = await context.params;

  return proxyJson(request, `/attendance/overtime/${overtime_id}/escalate`, {
    method: "POST",
  });
}
