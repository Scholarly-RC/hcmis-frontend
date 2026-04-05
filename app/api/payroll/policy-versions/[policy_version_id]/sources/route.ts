import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    policy_version_id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { policy_version_id } = await context.params;
  return proxyJson(
    request,
    `/payroll/policy-versions/${policy_version_id}/sources`,
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { policy_version_id } = await context.params;
  const body = await request.text();
  return proxyJson(
    request,
    `/payroll/policy-versions/${policy_version_id}/sources`,
    {
      method: "PUT",
      body,
    },
  );
}
