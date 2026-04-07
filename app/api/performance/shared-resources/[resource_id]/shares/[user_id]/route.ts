import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    resource_id: string;
    user_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { resource_id, user_id } = await context.params;
  return proxyJson(
    request,
    `/performance/shared-resources/${resource_id}/shares/${user_id}`,
    {
      method: "DELETE",
    },
  );
}
