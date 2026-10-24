import type { ServiceId } from "@/lib/services";

export type PublicSlot = {
  id: string;
  startAt: string;
  durationMinutes: number;
};

export type HostSlot = PublicSlot & {
  visitorName: string | null;
  visitorEmail: string | null;
  serviceId: ServiceId | null;
  serviceDurationMinutes: number | null;
  priceMkd: number | null;
};
