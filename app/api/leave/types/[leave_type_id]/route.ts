import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    leave_type_id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { leave_type_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/leave/types/${leave_type_id}`, {
    method: "PUT",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { leave_type_id } = await context.params;

  return proxyJson(request, `/leave/types/${leave_type_id}`, {
    method: "DELETE",
  });
}
