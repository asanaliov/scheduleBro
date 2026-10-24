import { z } from "zod";

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid start time."),
  durationMinutes: z.number().int().min(15).max(240),
});

export const createBookingSchema = z.object({
  slotId: z.string().uuid(),
  visitorName: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Names must be 80 characters or fewer.")
    .refine((name) => !/[\u0000-\u001f\u007f]/u.test(name), "Enter a valid name."),
  visitorEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254, "Email addresses must be 254 characters or fewer."),
});

export const slotIdSchema = z.string().uuid();
