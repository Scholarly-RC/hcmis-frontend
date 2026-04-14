import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{ training_id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { training_id } = await context.params;
  return proxyJson(request, `/trainings/${training_id}`);
}
