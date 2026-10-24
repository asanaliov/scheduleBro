import { apiError, handleApiError, parseJsonBody } from "@/lib/server/api";
import { createBookingSchema } from "@/lib/server/schemas";
import { bookSlot } from "@/lib/server/schedule";

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseJsonBody(request, createBookingSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  try {
    const booking = bookSlot(
      parsed.data.slotId,
      parsed.data.serviceId,
      parsed.data.visitorName,
      parsed.data.visitorEmail,
    );

    return Response.json(
      {
        data: {
          slot: booking.slot,
          visitorName: booking.visitorName,
          serviceId: booking.serviceId,
          serviceDurationMinutes: booking.serviceDurationMinutes,
          priceMkd: booking.priceMkd,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError(
        "SLOT_UNAVAILABLE",
        "Someone just booked this time. Please choose another slot.",
        409,
      );
    }

    return handleApiError(error);
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
