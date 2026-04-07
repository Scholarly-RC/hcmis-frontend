import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/performance/shared-resources/shareable-users?${query}`
      : "/performance/shared-resources/shareable-users";
  return proxyJson(request, pathname);
}
