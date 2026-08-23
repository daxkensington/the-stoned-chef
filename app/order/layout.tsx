import type { Metadata } from "next";
import Link from "next/link";
import {
  ONLINE_ORDERING_ENABLED,
  ORDERING_CLOSED_HEADING,
  ORDERING_CLOSED_MSG,
} from "@shared/const";

// While the till is closed this page must not be indexed or advertised as a
// checkout — the old title promised one. Metadata is picked per build from the
// same flag the layout branches on, so the two can't drift.
export const metadata: Metadata = ONLINE_ORDERING_ENABLED
  ? {
      title: "Place Your Order | The Stoned Chef",
      description:
        "Complete your order for pickup from The Stoned Chef chip truck in Deseronto, ON.",
    }
  : {
      title: `${ORDERING_CLOSED_HEADING} | The Stoned Chef`,
      description: ORDERING_CLOSED_MSG,
      robots: "noindex, follow",
    };

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  // Kept as a wrapper rather than deleting the checkout: the page below is
  // untouched and working, so reopening is one flag in shared/const.ts. Any
  // bookmark, QR code or stale link to /order lands here instead of on a form
  // that would take a card and then be refused by the server.
  if (!ONLINE_ORDERING_ENABLED) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <div className="text-6xl mb-6" aria-hidden="true">
            🍔
          </div>
          <h1
            className="text-3xl sm:text-4xl mb-4 text-foreground"
            style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.04em" }}
          >
            {ORDERING_CLOSED_HEADING}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{ORDERING_CLOSED_MSG}</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
              }}
            >
              See the Menu
            </Link>
            <a
              href="https://maps.google.com/?q=45+Dundas+St,+Deseronto,+ON"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold border border-border text-foreground transition-transform hover:scale-105 active:scale-95"
            >
              Find the Truck
            </a>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
