import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    user_evaluation_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { user_evaluation_id } = await context.params;
  return proxyJson(
    request,
    `/performance/user-evaluations/${user_evaluation_id}/aggregate-summary`,
  );
}
