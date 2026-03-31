import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  return proxyJson(request, "/payroll/mp2");
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/payroll/mp2", {
    method: "PUT",
    body,
  });
}
