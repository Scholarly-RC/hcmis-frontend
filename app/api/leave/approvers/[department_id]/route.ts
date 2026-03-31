import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    department_id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { department_id } = await context.params;
  const body = await request.text();

  return proxyJson(request, `/leave/approvers/${department_id}`, {
    method: "PUT",
    body,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { department_id } = await context.params;

  return proxyJson(request, `/leave/approvers/${department_id}`, {
    method: "DELETE",
  });
}
