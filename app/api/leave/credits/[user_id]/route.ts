import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    user_id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { user_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/leave/credits/${user_id}`, {
    method: "PUT",
    body,
  });
}
