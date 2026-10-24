"use client";

import { useEffect, useRef } from "react";

export default function BarbershopReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionRefCurrent = sectionRef.current;

    if (!sectionRefCurrent) return;

    const section = sectionRefCurrent;

    let frame = 0;

    function updateReveal() {
      frame = 0;
      const sectionTop = section.getBoundingClientRect().top;
      const scrollDistance = section.offsetHeight - window.innerHeight;
      const progress = scrollDistance > 0
        ? Math.min(1, Math.max(0, -sectionTop / scrollDistance))
        : 1;
      const navProgress = Math.min(1, Math.max(0, (progress - 0.58) / 0.22));
      const root = document.documentElement;

      section.style.setProperty("--left-offset", `${-progress * 108}%`);
      section.style.setProperty("--right-offset", `${progress * 108}%`);
      section.style.setProperty("--reveal-progress", String(progress));
      section.style.setProperty("--cue-opacity", String(Math.max(0, 1 - progress * 2)));
      root.style.setProperty("--booking-nav-opacity", String(navProgress));
      root.style.setProperty("--booking-nav-offset", `${-18 * (1 - navProgress)}px`);
      root.classList.toggle("booking-nav-ready", navProgress >= 0.02);
    }

    function queueUpdate() {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateReveal);
      }
    }

    updateReveal();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      document.documentElement.classList.remove("booking-nav-ready");
      document.documentElement.style.removeProperty("--booking-nav-opacity");
      document.documentElement.style.removeProperty("--booking-nav-offset");
    };
  }, []);

  return (
    <section
      aria-label="Schedule-Bro Barbershop"
      className="barbershop-reveal"
      ref={sectionRef}
    >
      <div className="barbershop-reveal-stage">
        <div className="reveal-grain" aria-hidden="true" />

        <div className="reveal-lockup">
          <p className="reveal-kicker">Haircuts &amp; shaves · Skopje</p>
          <div
            className="reveal-portrait"
            role="img"
            aria-label="Engraved barber portrait with a full beard and dark glasses"
          >
            <svg viewBox="0 0 360 360" aria-hidden="true">
              <defs>
                <linearGradient id="portrait-skin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f1d2a8" />
                  <stop offset="1" stopColor="#bd8761" />
                </linearGradient>
                <linearGradient id="portrait-beard" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#34312d" />
                  <stop offset="1" stopColor="#111211" />
                </linearGradient>
                <clipPath id="portrait-clip">
                  <circle cx="180" cy="180" r="148" />
                </clipPath>
              </defs>
              <circle cx="180" cy="180" r="177" fill="#171817" />
              <circle cx="180" cy="180" r="168" fill="#c79f71" />
              <circle cx="180" cy="180" r="158" fill="#f1e3cb" />
              <circle cx="180" cy="180" r="148" fill="#d7c09d" />
              <g clipPath="url(#portrait-clip)">
                <g fill="none" stroke="#b69a6d" strokeWidth="4" opacity=".72">
                  <path d="m46 292 77-78m114 0 77 78" />
                  <circle cx="61" cy="292" r="15" />
                  <circle cx="299" cy="292" r="15" />
                </g>
                <path d="M34 360c8-60 38-93 95-106h102c57 13 87 46 95 106H34Z" fill="#252725" />
                <path d="m132 246 48 50 48-50-18-29h-60l-18 29Z" fill="#c5946c" />
                <path d="m105 272 75 47 75-47-24-23-51 47-51-47-24 23Z" fill="#e1d4bd" />
                <path d="m165 302 15 17 15-17-15-14-15 14Z" fill="#a23831" />

                <path d="M95 143c-17-28-15-69 7-95 17-22 47-33 75-30 36-5 69 9 86 37 17 27 18 58 5 90l-21 29H111l-16-31Z" fill="#171817" />
                <path d="M101 107c-5-34 18-68 52-76-13 13-17 25-17 38 18-23 49-37 81-29-18 4-31 13-38 25 27-11 53-7 72 11-23-3-42 1-57 11 20-3 39 5 51 19-27-11-49-10-69 4-23 16-49 20-75 11Z" fill="#302f2c" />
                <path d="M117 91c18-25 40-41 68-49m-40 58c20-27 45-43 74-47m-34 49c20-20 41-28 63-24" fill="none" stroke="#777064" strokeWidth="2" strokeLinecap="round" opacity=".68" />
                <path d="M122 91c-10 20-15 43-15 68v37c0 49 31 82 73 82s73-33 73-82v-37c0-25-6-47-17-65-28 19-72 26-114-3Z" fill="url(#portrait-skin)" />
                <path d="M108 151c-10-7-18-2-17 10 1 13 8 23 20 24m138-34c10-7 18-2 17 10-1 13-8 23-20 24" fill="#c99169" />
                <path d="M109 201c12 18 26 27 42 31 10 3 20 1 29-5 9 6 19 8 29 5 16-4 30-13 42-31-4 26-10 47-23 63-12 15-28 27-48 37-20-10-36-22-48-37-13-16-19-37-23-63Z" fill="url(#portrait-beard)" />
                <path d="M119 221c8 8 17 13 29 16m93-16c-8 8-17 13-29 16" fill="none" stroke="#716b5f" strokeWidth="3" strokeLinecap="round" />
                <path d="M115 168c12-8 29-10 46-4l4 4v25c-12 8-30 9-44 2l-6-5v-22Zm69 0 4-4c17-6 34-4 46 4v22l-6 5c-14 7-32 6-44-2v-25Z" fill="#171817" stroke="#0e0f0e" strokeWidth="5" />
                <path d="M126 174c9-4 19-4 29-1m54 1c9-3 19-3 29 1" fill="none" stroke="#d8c6a7" strokeWidth="2.5" strokeLinecap="round" opacity=".78" />
                <path d="M164 172c5-4 12-4 17 0m3 0c5-4 12-4 17 0" fill="none" stroke="#0e0f0e" strokeWidth="5" strokeLinecap="round" />
                <path d="M164 186c-1 15-9 25-7 31 2 6 10 8 17 5" fill="none" stroke="#8d6147" strokeWidth="4" strokeLinecap="round" />
                <path d="M136 224c12-9 26-10 44 1 18-11 32-10 44-1-10 21-24 32-44 32s-34-11-44-32Z" fill="#302823" />
                <path d="M115 212c17-14 34-14 53 1 5 4 9 7 12 7s7-3 12-7c19-15 36-15 53-1-5 14-15 23-29 26-14 4-26 0-36-8-10 8-22 12-36 8-14-3-24-12-29-26Z" fill="#171817" />
                <path d="M123 214c10-7 18-7 27-2m88 2c-10-7-18-7-27-2" fill="none" stroke="#847b6d" strokeWidth="2" strokeLinecap="round" opacity=".75" />
                <path d="M151 250c6 17 16 31 29 42m29-42c-6 17-16 31-29 42" fill="none" stroke="#716b5f" strokeWidth="3" strokeLinecap="round" />
                <path d="M180 257v33" fill="none" stroke="#716b5f" strokeWidth="2" strokeLinecap="round" />
                <path d="M128 231c5 19 12 34 22 48m-5-52c4 20 11 37 20 53m-4-47c2 22 7 40 13 57m58-59c-5 19-12 34-22 48m5-52c-4 20-11 37-20 53m4-47c-2 22-7 40-13 57" fill="none" stroke="#918575" strokeWidth="1.6" strokeLinecap="round" opacity=".82" />
                <path d="M112 111c13 8 26 10 39 4m-31 10c10 6 20 7 30 3m76-17c-11 8-24 10-37 4m30 10c-10 6-20 7-30 3" fill="none" stroke="#777064" strokeWidth="2" strokeLinecap="round" opacity=".7" />
                <path d="M114 267 73 314m132-29 66 53M244 268l40 44M153 290l-53 42" fill="none" stroke="#bfa77f" strokeWidth="3" opacity=".75" />
              </g>
            </svg>
          </div>
          <h1 className="reveal-name">Schedule-Bro</h1>
          <p className="reveal-shop-name">Barbershop <span>·</span> Skopje</p>
          <p className="reveal-tagline">Your time. Your cut. Sorted.</p>
        </div>

        <a className="reveal-book-link" href="#services">
          Explore services <span aria-hidden="true">↓</span>
        </a>

        <p className="reveal-scroll-cue" aria-hidden="true">
          Scroll to open <span />
        </p>

        <div className="barber-shutter barber-shutter-left" aria-hidden="true">
          <span className="shutter-word">HAIR</span>
          <span className="barber-pole" />
          <span className="shutter-edge" />
        </div>
        <div className="barber-shutter barber-shutter-right" aria-hidden="true">
          <span className="shutter-word">SHAVE</span>
          <span className="barber-pole" />
          <span className="shutter-edge" />
        </div>
      </div>
    </section>
  );
}
