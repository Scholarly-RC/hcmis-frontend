import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    segments: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params;
  const normalizedPath = segments.join("/");
  const query = request.nextUrl.searchParams.toString();
  const pathname =
    query.length > 0
      ? `/reports/${normalizedPath}?${query}`
      : `/reports/${normalizedPath}`;
  return proxyJson(request, pathname);
}
