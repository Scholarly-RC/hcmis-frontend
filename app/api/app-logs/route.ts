import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const pathname = query.length > 0 ? `/app-logs?${query}` : "/app-logs";
  return proxyJson(request, pathname);
}
