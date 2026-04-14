import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    request_id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { request_id } = await context.params;

  return proxyJson(
    request,
    `/special-requests/certificate-attendance/${request_id}/cancel`,
    {
      method: "PATCH",
    },
  );
}
