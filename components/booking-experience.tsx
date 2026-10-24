"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PublicSlot } from "@/lib/types";
import { SERVICES, formatServicePrice, type ServiceId } from "@/lib/services";
import { formatScheduleDate, formatScheduleTime } from "@/lib/time";
import BarbershopReveal from "@/components/barbershop-reveal";

type ApiError = {
  error?: { message?: string };
};

type BookingConfirmation = {
  visitorName: string;
  slot: PublicSlot;
  serviceId: ServiceId;
  serviceDurationMinutes: number;
  priceMkd: number;
};

type Props = {
  initialSlots: PublicSlot[];
  initialServiceId: ServiceId;
};

export default function BookingExperience({
  initialSlots,
  initialServiceId,
}: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedService = SERVICES.find((service) => service.id === serviceId)!;
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
    const controller = new AbortController();

    async function loadAvailability() {
      setLoadingAvailability(true);

      try {
        const response = await fetch(
          `/api/slots?serviceId=${encodeURIComponent(serviceId)}`,
          { cache: "no-store", signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Availability could not be refreshed.");
        }

        const result = (await response.json()) as { data: PublicSlot[] };
        setSlots(result.data);
      } catch {
        if (!controller.signal.aborted) {
          setMessage("Availability could not be refreshed. Please try again.");
          setMessageIsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();
    return () => controller.abort();
  }, [serviceId]);

  async function refreshAvailability(): Promise<void> {
    const response = await fetch(
      `/api/slots?serviceId=${encodeURIComponent(serviceId)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Availability could not be refreshed.");
    }

    const result = (await response.json()) as { data: PublicSlot[] };
    setSlots(result.data);
  }

  function chooseService(nextServiceId: ServiceId) {
    if (nextServiceId === serviceId) return;

    setServiceId(nextServiceId);
    setSlots([]);
    setSelectedSlotId(null);
    setConfirmation(null);
    setMessage("");
    setMessageIsError(false);
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
          serviceId,
          visitorName,
          visitorEmail,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setMessage(
          result.error?.message ?? "Your appointment could not be booked.",
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
    <main className="page-content booking-page" id="main-content">
      <BarbershopReveal />

      <section
        className="service-section"
        id="services"
        aria-labelledby="services-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">The menu</p>
            <h2 id="services-title">Choose your service</h2>
          </div>
          <span className="timezone-note">Prices in MKD</span>
        </div>

        <div className="service-grid" role="group" aria-label="Choose a service">
          {SERVICES.map((service, index) => {
            const selected = service.id === serviceId;

            return (
              <button
                aria-pressed={selected}
                className={`service-card${selected ? " is-selected" : ""}`}
                key={service.id}
                onClick={() => chooseService(service.id)}
                type="button"
              >
                <span className="service-number">0{index + 1}</span>
                <span className="service-name">{service.name}</span>
                <span className="service-description">{service.description}</span>
                <span className="service-meta">
                  <span>{service.durationMinutes} minutes</span>
                  <strong>{formatServicePrice(service.priceMkd)}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="booking-layout">
        <section className="panel slot-panel" aria-labelledby="available-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{selectedService.name}</p>
              <h2 id="available-title">Choose a time</h2>
            </div>
            <span className="count-label">
              {slots.length} {slots.length === 1 ? "opening" : "openings"}
            </span>
          </div>

          {loadingAvailability ? (
            <p className="availability-message" role="status">
              Checking times for this service…
            </p>
          ) : groupedSlots.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">·</span>
              <h3>No openings fit this service</h3>
              <p>Try another service or check back when the barber adds time.</p>
            </div>
          ) : (
            <div className="slot-groups">
              {groupedSlots.map(([day, daySlots]) => (
                <section className="slot-group" key={day} aria-label={day}>
                  <h3>{day}</h3>
                  <div className="slot-grid">
                    {daySlots.map((slot) => {
                      const selected = slot.id === selectedSlotId;

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
                            {formatScheduleTime(Date.parse(slot.startAt))}
                          </time>
                          <span className="slot-choice-duration">
                            {slot.durationMinutes} min window
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
              <p className="eyebrow">Your visit</p>
              <h2 id="booking-title">Book the chair</h2>
            </div>
          </div>

          {confirmation ? (
            <div className="confirmation-state" role="status">
              <span className="confirmation-mark" aria-hidden="true">✓</span>
              <p className="eyebrow">Appointment confirmed</p>
              <h3>You’re booked, {confirmation.visitorName}.</h3>
              <p className="confirmation-time">
                {formatScheduleDate(Date.parse(confirmation.slot.startAt))}
                <br />
                {formatScheduleTime(Date.parse(confirmation.slot.startAt))}
              </p>
              <p className="muted-copy">
                {SERVICES.find((service) => service.id === confirmation.serviceId)?.name}
                {" · "}
                {confirmation.serviceDurationMinutes} minutes
                {" · "}
                {formatServicePrice(confirmation.priceMkd)}
              </p>
              <button
                className="text-button"
                onClick={() => setConfirmation(null)}
                type="button"
              >
                Book another service
              </button>
            </div>
          ) : selectedSlot ? (
            <form className="booking-form" onSubmit={submitBooking}>
              <div className="selected-summary">
                <span className="summary-label">Appointment</span>
                <strong>{selectedService.name}</strong>
                <span>
                  {formatScheduleDate(Date.parse(selectedSlot.startAt))} at{" "}
                  {formatScheduleTime(Date.parse(selectedSlot.startAt))}
                </span>
                <span className="summary-service-details">
                  {selectedService.durationMinutes} minutes ·{" "}
                  {formatServicePrice(selectedService.priceMkd)}
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
                {submitting ? "Booking your chair…" : "Confirm appointment"}
              </button>
              <p className="privacy-note">
                Your contact details are shared with the barber for this booking.
              </p>
            </form>
          ) : (
            <div className="booking-prompt">
              <span className="prompt-number">01</span>
              <h3>Pick a time to continue</h3>
              <p>
                {selectedService.name} · {selectedService.durationMinutes} minutes
                <br />
                {formatServicePrice(selectedService.priceMkd)}
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
