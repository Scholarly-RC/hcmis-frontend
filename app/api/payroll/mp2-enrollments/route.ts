import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/payroll/mp2-enrollments?${query}`
      : "/payroll/mp2-enrollments";
  return proxyJson(request, pathname);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/payroll/mp2-enrollments", {
    method: "POST",
    body,
  });
}
