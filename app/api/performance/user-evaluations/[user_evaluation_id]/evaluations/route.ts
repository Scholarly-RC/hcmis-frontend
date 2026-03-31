import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    user_evaluation_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { user_evaluation_id } = await context.params;
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/performance/user-evaluations/${user_evaluation_id}/evaluations?${query}`
      : `/performance/user-evaluations/${user_evaluation_id}/evaluations`;
  return proxyJson(request, pathname);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { user_evaluation_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/performance/user-evaluations/${user_evaluation_id}/evaluations`,
    {
      method: "POST",
      body,
    },
  );
}
