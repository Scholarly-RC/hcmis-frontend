import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    evaluation_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { evaluation_id } = await context.params;
  return proxyJson(
    request,
    `/performance/evaluations/${evaluation_id}/submit`,
    {
      method: "POST",
    },
  );
}
