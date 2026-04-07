import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    enrollment_id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { enrollment_id } = await context.params;
  return proxyJson(request, `/payroll/mp2-enrollments/${enrollment_id}/end`, {
    method: "POST",
  });
}
