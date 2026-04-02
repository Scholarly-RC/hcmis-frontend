import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  return proxyJson(request, "/departments");
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  return proxyJson(request, "/departments", {
    method: "POST",
    body,
  });
}
