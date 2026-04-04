import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    notification_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { notification_id } = await context.params;
  return proxyJson(request, `/notifications/${notification_id}/read`, {
    method: "POST",
  });
}
