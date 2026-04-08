import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    item_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { item_id } = await context.params;
  return proxyJson(
    request,
    `/payroll/payslips/variable-compensations/${item_id}`,
    {
      method: "DELETE",
    },
  );
}
