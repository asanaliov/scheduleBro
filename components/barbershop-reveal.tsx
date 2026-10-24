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

      section.style.setProperty("--left-offset", `${-progress * 108}%`);
      section.style.setProperty("--right-offset", `${progress * 108}%`);
      section.style.setProperty("--reveal-progress", String(progress));
      section.style.setProperty("--cue-opacity", String(Math.max(0, 1 - progress * 2)));
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
            aria-label="Illustration of a barber with a styled beard and glasses"
          >
            <svg viewBox="0 0 300 320" aria-hidden="true">
              <circle cx="150" cy="160" r="146" fill="#d3b38c" />
              <circle cx="150" cy="160" r="132" fill="#e7d6bb" />
              <path
                d="M66 126c-4-53 31-91 83-91 48 0 85 34 85 88v40H66v-37Z"
                fill="#181817"
              />
              <path
                d="M82 133c0-35 28-63 68-63 41 0 70 28 70 66v61c0 41-27 67-70 67-42 0-68-26-68-67v-64Z"
                fill="#e3bd96"
              />
              <path
                d="M76 167c9 22 14 41 16 60 3 32 20 62 58 78 39-16 56-45 59-78 2-19 7-38 16-60-15 17-26 29-40 34-22 8-50 4-68-3-17-6-28-17-41-31Z"
                fill="#181817"
              />
              <path
                d="M80 132c7-34 34-53 70-53 30 0 54 13 69 37-19-4-32-13-44-24-13 17-41 28-95 25Z"
                fill="#181817"
              />
              <path d="M104 149h41v25h-41a13 13 0 0 1 0-25Zm51 0h41a13 13 0 0 1 0 25h-41v-25Z" fill="#222221" />
              <path d="M145 157h10" stroke="#222221" strokeWidth="7" strokeLinecap="round" />
              <path d="M113 158h22m-22 7h22m26-7h22m-22 7h22" stroke="#d5b18a" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M113 194c14-9 26-8 37 4 11-12 24-13 38-4-8 20-22 29-38 29-17 0-30-9-37-29Z"
                fill="#181817"
              />
              <path d="M136 185h28l-7 19h-14l-7-19Z" fill="#c79870" />
              <path d="M135 211c9 6 21 6 30 0" stroke="#e3bd96" strokeWidth="4" strokeLinecap="round" />
              <path d="M72 137c-8-5-13 1-11 12 2 10 8 16 17 17m150-29c8-5 13 1 11 12-2 10-8 16-17 17" fill="#e3bd96" />
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
