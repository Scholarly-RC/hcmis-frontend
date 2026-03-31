import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  return proxyJson(request, "/payroll/settings");
}

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/payroll/settings", {
    method: "PATCH",
    body,
  });
}
