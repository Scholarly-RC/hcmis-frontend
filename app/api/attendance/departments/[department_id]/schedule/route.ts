import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    department_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { department_id } = await context.params;
  return proxyJson(
    request,
    `/attendance/departments/${department_id}/schedule`,
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { department_id } = await context.params;
  const body = await request.text();

  return proxyJson(
    request,
    `/attendance/departments/${department_id}/schedule`,
    {
      method: "PATCH",
      body,
    },
  );
}
