import HostDashboard from "@/components/host-dashboard";
import { listHostSlots } from "@/lib/server/schedule";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Barber desk | Schedule-Bro",
  description: "Manage Schedule-Bro Barbershop availability and bookings.",
};

export default function HostPage() {
  return (
    <HostDashboard initialSlots={listHostSlots()} />
  );
}
