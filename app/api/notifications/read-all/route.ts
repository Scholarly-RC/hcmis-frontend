import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function POST(request: NextRequest) {
  return proxyJson(request, "/notifications/read-all", {
    method: "POST",
  });
}
