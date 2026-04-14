import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    user_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { user_id } = await context.params;
  return proxyJson(request, `/users/${user_id}/employment-movements`);
}
