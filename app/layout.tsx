import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schedule-Bro | Skopje barbershop",
  description: "A better cut, booked with Schedule-Bro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <header className="site-header">
            <Link className="brand" href="/" aria-label="Schedule-Bro home">
              <span className="brand-mark" aria-hidden="true">SB</span>
              <span className="brand-copy">
                <span>Schedule-Bro</span>
                <span className="brand-subtitle">Barbershop · Skopje</span>
              </span>
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
              <Link href="/#services">Book a chair</Link>
              <Link href="/host">Barber desk</Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <span>Schedule-Bro Barbershop · Skopje</span>
            <span>Times shown in Europe/Skopje</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
