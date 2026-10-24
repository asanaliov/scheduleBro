import { apiError, handleApiError } from "@/lib/server/api";
import { slotIdSchema } from "@/lib/server/schemas";
import { deleteUnbookedSlot } from "@/lib/server/schedule";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const parsedId = slotIdSchema.safeParse(id);

  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "That slot ID is invalid.", 400);
  }

  try {
    const result = deleteUnbookedSlot(parsedId.data);

    if (result === "not_found") {
      return apiError("SLOT_NOT_FOUND", "That time no longer exists.", 404);
    }

    if (result === "booked") {
      return apiError(
        "SLOT_BOOKED",
        "Booked times cannot be deleted.",
        409,
      );
    }

    return Response.json({ data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
