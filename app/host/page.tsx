import HostDashboard from "@/components/host-dashboard";
import { listHostSlots } from "@/lib/server/schedule";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Host dashboard | Schedule-Bro",
  description: "Publish and manage your Schedule-Bro availability.",
};

export default function HostPage() {
  return (
    <HostDashboard initialSlots={listHostSlots()} />
  );
}
