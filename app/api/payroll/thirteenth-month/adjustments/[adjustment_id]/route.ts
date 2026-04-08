import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    adjustment_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { adjustment_id } = await context.params;
  return proxyJson(
    request,
    `/payroll/thirteenth-month/adjustments/${adjustment_id}`,
    {
      method: "DELETE",
    },
  );
}
