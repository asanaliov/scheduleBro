import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schedule-Bro | Your time. Your slots. Sorted.",
  description:
    "A simple way to publish availability and book a time that works.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link className="brand" href="/" aria-label="Schedule-Bro home">
              <span className="brand-mark" aria-hidden="true">sb</span>
              <span>Schedule-Bro</span>
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
              <Link href="/">Book a time</Link>
              <Link href="/host">Host dashboard</Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <span>Your time. Your slots. Sorted.</span>
            <span>Times shown in Europe/Skopje</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
