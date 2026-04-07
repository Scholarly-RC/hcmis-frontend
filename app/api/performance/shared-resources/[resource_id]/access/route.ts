import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    resource_id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { resource_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/performance/shared-resources/${resource_id}/access`,
    {
      method: "PUT",
      body,
    },
  );
}
