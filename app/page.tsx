import BookingExperience from "@/components/booking-experience";
import { listAvailableSlots } from "@/lib/server/schedule";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Schedule-Bro Barbershop | Book a chair",
  description: "Choose a barber service and book your time in Skopje.",
};

export default function HomePage() {
  const initialServiceId = SERVICES[0].id;

  return (
    <BookingExperience
      initialServiceId={initialServiceId}
      initialSlots={listAvailableSlots(initialServiceId)}
    />
  );
}
