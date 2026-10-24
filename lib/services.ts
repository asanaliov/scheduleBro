export const SERVICE_IDS = ["haircut", "beard-trim", "haircut-beard"] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type Service = {
  id: ServiceId;
  name: string;
  description: string;
  durationMinutes: number;
  priceMkd: number;
};

export const SERVICES: readonly Service[] = [
  {
    id: "haircut",
    name: "Haircut",
    description: "Consultation, cut and a clean finish.",
    durationMinutes: 30,
    priceMkd: 900,
  },
  {
    id: "beard-trim",
    name: "Beard trim",
    description: "Shape, line-up and hot towel finish.",
    durationMinutes: 20,
    priceMkd: 500,
  },
  {
    id: "haircut-beard",
    name: "Haircut + beard",
    description: "A full reset, from hairline to neckline.",
    durationMinutes: 45,
    priceMkd: 1_250,
  },
];

export function getService(serviceId: string): Service | undefined {
  return SERVICES.find((service) => service.id === serviceId);
}

export function formatServicePrice(priceMkd: number): string {
  const amount = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(priceMkd);

  return `MKD ${amount}`;
}
