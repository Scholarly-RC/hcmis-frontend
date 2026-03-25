import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

export async function GET(request: NextRequest) {
  return proxyJson(request, "/attendance/shift-assignments");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/attendance/shift-assignments", {
    method: "POST",
    body,
  });
}
