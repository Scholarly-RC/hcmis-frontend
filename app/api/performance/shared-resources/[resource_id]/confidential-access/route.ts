import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    resource_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { resource_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/performance/shared-resources/${resource_id}/confidential-access`,
    {
      method: "POST",
      body,
    },
  );
}
