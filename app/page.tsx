import BookingExperience from "@/components/booking-experience";
import { listAvailableSlots } from "@/lib/server/schedule";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book a time | Schedule-Bro",
  description: "Choose an open appointment time with Schedule-Bro.",
};

export default function HomePage() {
  return <BookingExperience initialSlots={listAvailableSlots()} />;
}
