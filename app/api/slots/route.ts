import { listAvailableSlots } from "@/lib/server/schedule";
import { apiError, handleApiError } from "@/lib/server/api";
import { serviceIdSchema } from "@/lib/server/schemas";

export function GET(request: Request): Response {
  try {
    const serviceId = new URL(request.url).searchParams.get("serviceId");
    const parsedServiceId = serviceIdSchema.safeParse(serviceId);

    if (serviceId !== null && !parsedServiceId.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Choose one of the listed services.",
        400,
      );
    }

    return Response.json(
      { data: listAvailableSlots(parsedServiceId.success ? parsedServiceId.data : undefined) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
