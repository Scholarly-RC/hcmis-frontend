import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    resource_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { resource_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/performance/shared-resources/${resource_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { resource_id } = await context.params;
  return proxyJson(request, `/performance/shared-resources/${resource_id}`, {
    method: "DELETE",
  });
}
