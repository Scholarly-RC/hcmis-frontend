import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{ training_id: string; participant_id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { training_id, participant_id } = await context.params;
  const body = await request.formData();
  return proxyJson(
    request,
    `/trainings/${training_id}/participants/${participant_id}/attachments`,
    {
      method: "POST",
      body,
    },
  );
}
