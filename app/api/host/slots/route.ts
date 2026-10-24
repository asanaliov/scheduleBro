import { createSlotSchema } from "@/lib/server/schemas";
import { handleApiError, parseJsonBody } from "@/lib/server/api";
import {
  createSlot,
  listHostSlots,
} from "@/lib/server/schedule";

export function GET(): Response {
  try {
    return Response.json(
      { data: listHostSlots() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseJsonBody(request, createSlotSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  try {
    const slot = createSlot(
      parsed.data.date,
      parsed.data.startTime,
      parsed.data.durationMinutes,
    );
    return Response.json({ data: slot }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
