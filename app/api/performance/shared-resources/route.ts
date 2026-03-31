import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/performance/shared-resources?${query}`
      : "/performance/shared-resources";
  return proxyJson(request, pathname);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/performance/shared-resources", {
    method: "POST",
    body,
  });
}
