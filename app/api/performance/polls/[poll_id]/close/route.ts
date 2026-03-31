import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    poll_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { poll_id } = await context.params;
  return proxyJson(request, `/performance/polls/${poll_id}/close`, {
    method: "POST",
  });
}
