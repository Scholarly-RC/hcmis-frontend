import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    user_evaluation_id: string;
    evaluator_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { user_evaluation_id, evaluator_id } = await context.params;
  return proxyJson(
    request,
    `/performance/user-evaluations/${user_evaluation_id}/assignments/${evaluator_id}`,
    {
      method: "DELETE",
    },
  );
}
