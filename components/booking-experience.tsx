"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PublicSlot } from "@/lib/types";
import { formatScheduleDate, formatScheduleTime } from "@/lib/time";

type ApiError = {
  error?: { message?: string };
};

type BookingConfirmation = {
  visitorName: string;
  slot: PublicSlot;
};

type Props = {
  initialSlots: PublicSlot[];
};

export default function BookingExperience({ initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, PublicSlot[]>();

    for (const slot of slots) {
      const day = formatScheduleDate(Date.parse(slot.startAt));
      groups.set(day, [...(groups.get(day) ?? []), slot]);
    }

    return [...groups.entries()];
  }, [slots]);

  useEffect(() => {
    let active = true;

    async function loadLatestAvailability() {
      try {
        const response = await fetch("/api/slots", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Availability could not be refreshed.");
        }
        const result = (await response.json()) as { data: PublicSlot[] };

        if (active) {
          setSlots(result.data);
        }
      } catch {
        if (active) {
          setMessage("Availability could not be refreshed. Please try again.");
          setMessageIsError(true);
        }
      }
    }

    void loadLatestAvailability();

    return () => {
      active = false;
    };
  }, []);

  async function refreshAvailability(): Promise<void> {
    const response = await fetch("/api/slots", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Availability could not be refreshed.");
    }
    const result = (await response.json()) as { data: PublicSlot[] };
    setSlots(result.data);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot) {
      setMessage("Choose an available time first.");
      setMessageIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          visitorName,
          visitorEmail,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setMessage(
          result.error?.message ?? "Your booking could not be completed.",
        );
        setMessageIsError(true);

        if (response.status === 409) {
          setSlots((currentSlots) =>
            currentSlots.filter((slot) => slot.id !== selectedSlot.id),
          );
          setSelectedSlotId(null);
          await refreshAvailability();
        }
        return;
      }

      const result = (await response.json()) as {
        data: BookingConfirmation;
      };
      setConfirmation(result.data);
      setSlots((currentSlots) =>
        currentSlots.filter((slot) => slot.id !== selectedSlot.id),
      );
      setSelectedSlotId(null);
      setVisitorName("");
      setVisitorEmail("");
      await refreshAvailability();
    } catch {
      setMessage("We could not reach the schedule. Please try again.");
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-content">
      <section className="page-intro">
        <p className="eyebrow">Simple scheduling, sorted</p>
        <h1>Find a time that works.</h1>
        <p className="intro-copy">
          Choose an open slot and book it in a few seconds. Times are shown in
          Europe/Skopje.
        </p>
      </section>

      <div className="booking-layout">
        <section className="panel slot-panel" aria-labelledby="available-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Availability</p>
              <h2 id="available-title">Choose a time</h2>
            </div>
            <span className="count-label">
              {slots.length} {slots.length === 1 ? "time" : "times"}
            </span>
          </div>

          {groupedSlots.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">·</span>
              <h3>No times available right now</h3>
              <p>Please check back soon. New availability will appear here.</p>
            </div>
          ) : (
            <div className="slot-groups">
              {groupedSlots.map(([day, daySlots]) => (
                <section className="slot-group" key={day} aria-label={day}>
                  <h3>{day}</h3>
                  <div className="slot-grid">
                    {daySlots.map((slot) => {
                      const selected = slot.id === selectedSlotId;
                      const time = Date.parse(slot.startAt);

                      return (
                        <button
                          aria-pressed={selected}
                          className={`slot-choice${selected ? " is-selected" : ""}`}
                          key={slot.id}
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setConfirmation(null);
                            setMessage("");
                            setMessageIsError(false);
                          }}
                          type="button"
                        >
                          <time
                            className="slot-choice-time"
                            dateTime={slot.startAt}
                          >
                            {formatScheduleTime(time)}
                          </time>
                          <span className="slot-choice-duration">
                            {slot.durationMinutes} min
                          </span>
                          <span className="slot-choice-action">
                            {selected ? "Selected" : "Choose"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside className="panel booking-panel" aria-labelledby="booking-title">
          <div className="panel-heading booking-heading">
            <div>
              <p className="eyebrow">Your details</p>
              <h2 id="booking-title">Confirm your time</h2>
            </div>
          </div>

          {confirmation ? (
            <div className="confirmation-state" role="status">
              <span className="confirmation-mark" aria-hidden="true">✓</span>
              <h3>You’re booked, {confirmation.visitorName}.</h3>
              <p>
                {formatScheduleDate(Date.parse(confirmation.slot.startAt))} at{" "}
                {formatScheduleTime(Date.parse(confirmation.slot.startAt))}
              </p>
              <p className="muted-copy">
                Your {confirmation.slot.durationMinutes}-minute time is confirmed.
              </p>
              <button
                className="text-button"
                onClick={() => setConfirmation(null)}
                type="button"
              >
                Book another time
              </button>
            </div>
          ) : selectedSlot ? (
            <form className="booking-form" onSubmit={submitBooking}>
              <div className="selected-summary">
                <span className="summary-label">Selected time</span>
                <strong>
                  {formatScheduleDate(Date.parse(selectedSlot.startAt))}
                </strong>
                <span>
                  {formatScheduleTime(Date.parse(selectedSlot.startAt))} ·{" "}
                  {selectedSlot.durationMinutes} minutes
                </span>
              </div>

              <label className="field-label" htmlFor="visitor-name">
                Your name
              </label>
              <input
                autoComplete="name"
                id="visitor-name"
                maxLength={80}
                onChange={(event) => setVisitorName(event.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                value={visitorName}
              />

              <label className="field-label" htmlFor="visitor-email">
                Email address
              </label>
              <input
                autoComplete="email"
                id="visitor-email"
                maxLength={254}
                onChange={(event) => setVisitorEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={visitorEmail}
              />

              {message && (
                <p
                  className={`form-message${messageIsError ? " is-error" : " is-success"}`}
                  role={messageIsError ? "alert" : "status"}
                >
                  {message}
                </p>
              )}

              <button className="primary-button full-button" disabled={submitting}>
                {submitting ? "Booking your time…" : "Book this time"}
              </button>
              <p className="privacy-note">
                Your contact details are only shared with the host.
              </p>
            </form>
          ) : (
            <div className="booking-prompt">
              <span className="prompt-number">01</span>
              <h3>Pick a slot to get started</h3>
              <p>
                Once you choose a time, you can add your name and email here.
              </p>
            </div>
          )}

          {!confirmation && message && !selectedSlot && (
            <p className="form-message is-error" role="alert">
              {message}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
