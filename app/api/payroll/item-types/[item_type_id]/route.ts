import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    item_type_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { item_type_id } = await context.params;
  const body = await request.text();
  return proxyJson(request, `/payroll/item-types/${item_type_id}`, {
    method: "PATCH",
    body,
  });
}
