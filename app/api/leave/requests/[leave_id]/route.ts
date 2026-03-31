import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    leave_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { leave_id } = await context.params;
  return proxyJson(request, `/leave/requests/${leave_id}`, {
    method: "DELETE",
  });
}
