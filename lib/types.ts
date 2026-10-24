export type PublicSlot = {
  id: string;
  startAt: string;
  durationMinutes: number;
};

export type HostSlot = PublicSlot & {
  visitorName: string | null;
  visitorEmail: string | null;
};
