import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    policy_version_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { policy_version_id } = await context.params;
  return proxyJson(
    request,
    `/payroll/policy-versions/${policy_version_id}/activate`,
    {
      method: "POST",
    },
  );
}
