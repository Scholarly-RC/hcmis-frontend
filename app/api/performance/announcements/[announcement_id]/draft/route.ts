import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    announcement_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { announcement_id } = await context.params;
  return proxyJson(
    request,
    `/performance/announcements/${announcement_id}/draft`,
    {
      method: "POST",
    },
  );
}
