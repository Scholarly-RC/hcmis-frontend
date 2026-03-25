import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    shift_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { shift_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/attendance/shift-templates/${shift_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { shift_id } = await context.params;

  return proxyJson(request, `/attendance/shift-templates/${shift_id}`, {
    method: "DELETE",
  });
}
