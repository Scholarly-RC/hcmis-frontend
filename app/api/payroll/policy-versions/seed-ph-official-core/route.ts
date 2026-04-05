import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/payroll/policy-versions/seed-ph-official-core", {
    method: "POST",
    body,
  });
}
