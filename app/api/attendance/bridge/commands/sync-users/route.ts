import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/attendance/bridge/commands/sync-users", {
    method: "POST",
    body,
  });
}
