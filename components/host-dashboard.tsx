"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { HostSlot } from "@/lib/types";
import { formatScheduleDate, formatScheduleTime } from "@/lib/time";

type ApiError = {
  error?: { message?: string };
};

type Props = {
  initialSlots: HostSlot[];
};

type SlotFilter = "all" | "available" | "booked";

export default function HostDashboard({ initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [filter, setFilter] = useState<SlotFilter>("all");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const availableCount = slots.filter((slot) => slot.visitorName === null).length;
  const bookedCount = slots.length - availableCount;
  const visibleSlots = useMemo(
    () =>
      slots.filter((slot) => {
        if (filter === "available") return slot.visitorName === null;
        if (filter === "booked") return slot.visitorName !== null;
        return true;
      }),
    [filter, slots],
  );

  useEffect(() => {
    let active = true;

    async function loadLatestSlots() {
      try {
        const response = await fetch("/api/host/slots", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { data: HostSlot[] };
        if (active) setSlots(result.data);
      } catch {
        // The server-rendered list remains usable if the refresh is unavailable.
      }
    }

    void loadLatestSlots();
    return () => {
      active = false;
    };
  }, []);

  async function refreshSlots(): Promise<void> {
    const response = await fetch("/api/host/slots", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("The schedule could not be refreshed.");
    }
    const result = (await response.json()) as { data: HostSlot[] };
    setSlots(result.data);
  }

  async function createAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch("/api/host/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, durationMinutes }),
      });

      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setMessage(result.error?.message ?? "The time could not be published.");
        setMessageIsError(true);
        return;
      }

      setDate("");
      setMessage("Your availability is published.");
      await refreshSlots();
    } catch {
      setMessage("We could not reach the schedule. Please try again.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(slotId: string) {
    setDeletingId(slotId);
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch(`/api/host/slots/${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        setMessage(result.error?.message ?? "This time could not be removed.");
        setMessageIsError(true);
        await refreshSlots();
        return;
      }

      setMessage("Availability removed.");
      await refreshSlots();
    } catch {
      setMessage("We could not reach the schedule. Please try again.");
      setMessageIsError(true);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page-content host-content">
      <section className="page-intro host-intro">
        <p className="eyebrow">Host workspace</p>
        <h1>Make room in your schedule.</h1>
        <p className="intro-copy">
          Publish a time, then let Schedule-Bro take care of the booking.
        </p>
      </section>

      <div className="host-notice" role="note">
        <span className="notice-mark" aria-hidden="true">!</span>
        <p>
          <strong>This host page has no login.</strong> Anyone who can open it can
          manage availability and view booking details. Keep this MVP private.
        </p>
      </div>

      <div className="host-layout">
        <section className="panel create-panel" aria-labelledby="create-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New availability</p>
              <h2 id="create-title">Add a time</h2>
            </div>
          </div>

          <form className="create-form" onSubmit={createAvailability}>
            <label className="field-label" htmlFor="slot-date">Date</label>
            <input
              id="slot-date"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />

            <label className="field-label" htmlFor="slot-time">Start time</label>
            <input
              id="slot-time"
              onChange={(event) => setStartTime(event.target.value)}
              required
              step={900}
              type="time"
              value={startTime}
            />

            <label className="field-label" htmlFor="slot-duration">Duration</label>
            <select
              id="slot-duration"
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              value={durationMinutes}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1 hour 30 minutes</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
            </select>

            <p className="field-hint">
              Choose 15 to 240 minutes. Times use Europe/Skopje.
            </p>

            {message && (
              <p
                className={`form-message${messageIsError ? " is-error" : " is-success"}`}
                role={messageIsError ? "alert" : "status"}
              >
                {message}
              </p>
            )}

            <button className="primary-button full-button" disabled={saving}>
              {saving ? "Publishing…" : "Publish availability"}
            </button>
          </form>
        </section>

        <section className="host-schedule" aria-labelledby="schedule-title">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Available</span>
              <strong>{availableCount}</strong>
              <span className="stat-footnote">Open to visitors</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Booked</span>
              <strong>{bookedCount}</strong>
              <span className="stat-footnote">Confirmed times</span>
            </div>
          </div>

          <div className="schedule-heading">
            <div>
              <p className="eyebrow">Your calendar</p>
              <h2 id="schedule-title">Upcoming times</h2>
            </div>
            <div className="filter-tabs" role="group" aria-label="Filter times">
              {(["all", "available", "booked"] as const).map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={filter === option ? "is-active" : ""}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option === "all" ? "All" : option === "available" ? "Open" : "Booked"}
                </button>
              ))}
            </div>
          </div>

          {visibleSlots.length === 0 ? (
            <div className="panel host-empty-state">
              <span className="empty-mark" aria-hidden="true">·</span>
              <h3>
                {slots.length === 0 ? "Your schedule is clear" : "No times in this view"}
              </h3>
              <p>
                {slots.length === 0
                  ? "Add availability and it will appear here for you and your visitors."
                  : "Choose another filter to see your other upcoming times."}
              </p>
            </div>
          ) : (
            <div className="host-slot-list">
              {visibleSlots.map((slot) => {
                const isBooked = slot.visitorName !== null;
                const timestamp = Date.parse(slot.startAt);

                return (
                  <article className="panel host-slot" key={slot.id}>
                    <div className="host-slot-time">
                      <p>{formatScheduleDate(timestamp)}</p>
                      <h3>{formatScheduleTime(timestamp)}</h3>
                      <span>{slot.durationMinutes} minutes</span>
                    </div>
                    <div className="host-slot-details">
                      <span className={`status-pill${isBooked ? " is-booked" : " is-open"}`}>
                        <span aria-hidden="true" className="status-dot" />
                        {isBooked ? "Booked" : "Available"}
                      </span>
                      {isBooked ? (
                        <div className="visitor-details">
                          <strong>{slot.visitorName}</strong>
                          <a href={`mailto:${slot.visitorEmail}`}>{slot.visitorEmail}</a>
                        </div>
                      ) : (
                        <p className="slot-help-copy">Waiting for someone to book</p>
                      )}
                    </div>
                    {!isBooked && (
                      <button
                        aria-label={`Delete ${formatScheduleDate(timestamp)} at ${formatScheduleTime(timestamp)}`}
                        className="remove-button"
                        disabled={deletingId === slot.id}
                        onClick={() => void deleteSlot(slot.id)}
                        type="button"
                      >
                        {deletingId === slot.id ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
