import type { NextRequest } from "next/server";

import { proxyJson } from "@/app/api/_proxy";

type RouteContext = {
  params: Promise<{
    training_id: string;
    participant_id: string;
    attachment_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { training_id, participant_id, attachment_id } = await context.params;
  return proxyJson(
    request,
    `/trainings/${training_id}/participants/${participant_id}/attachments/${attachment_id}`,
    { method: "DELETE" },
  );
}
