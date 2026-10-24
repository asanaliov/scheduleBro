import { ZodError, type ZodType } from "zod";
import { ScheduleError } from "@/lib/server/schedule";

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): Response {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: Response }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      response: apiError("INVALID_JSON", "Send a valid JSON request body.", 400),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      response: apiError(
        "VALIDATION_ERROR",
        firstIssue?.message ?? "Check the information and try again.",
        400,
        result.error.flatten().fieldErrors,
      ),
    };
  }

  return { data: result.data };
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ScheduleError) {
    const statusByCode: Record<ScheduleError["code"], number> = {
      INVALID_DATE: 400,
      PAST_SLOT: 400,
      SLOT_OVERLAP: 409,
      SLOT_NOT_FOUND: 404,
      SLOT_UNAVAILABLE: 409,
    };

    return apiError(error.code, error.message, statusByCode[error.code]);
  }

  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Check the information and try again.", 400);
  }

  if (isSqliteCode(error, "SQLITE_BUSY")) {
    return apiError(
      "DATABASE_BUSY",
      "The schedule is busy right now. Please try again.",
      503,
    );
  }

  console.error("Schedule-Bro request failed.", error);
  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}

function isSqliteCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
