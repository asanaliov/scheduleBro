import { listAvailableSlots } from "@/lib/server/schedule";
import { handleApiError } from "@/lib/server/api";

export function GET(): Response {
  try {
    return Response.json(
      { data: listAvailableSlots() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
