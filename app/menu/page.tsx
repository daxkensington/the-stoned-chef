import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MENU_CATEGORIES } from "@shared/menu";
import {
  ONLINE_ORDERING_ENABLED,
  ORDERING_CLOSED_HEADING,
  ORDERING_CLOSED_MSG,
} from "@shared/const";

export const metadata: Metadata = {
  title: "Menu | The Stoned Chef — Deseronto Chip Truck",
  description: ONLINE_ORDERING_ENABLED
    ? "See the full menu at The Stoned Chef in Deseronto, ON — smash burgers, loaded poutines, crispy fish & chips, wings, wraps, and kids' meals. Order online for pickup, open daily 11am–7pm."
    : "See the full menu at The Stoned Chef in Deseronto, ON — smash burgers, loaded poutines, crispy fish & chips, wings, wraps, and kids' meals. Open daily 11am–7pm at 45 Dundas St.",
  alternates: { canonical: "https://thestonedchef.ca/menu" },
  openGraph: {
    title: "The Stoned Chef Menu — Deseronto, ON",
    description: ONLINE_ORDERING_ENABLED
      ? "Smash burgers, loaded poutines, crispy fish & chips, and more. Order online for pickup."
      : "Smash burgers, loaded poutines, crispy fish & chips, and more. Open daily at 45 Dundas St, Deseronto.",
    url: "https://thestonedchef.ca/menu",
    type: "website",
  },
};

function price(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function MenuPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="container pt-10 pb-6 text-center">
        <h1
          className="text-4xl sm:text-5xl mb-2"
          style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.04em" }}
        >
          Our Menu
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deseronto&apos;s favourite chip truck — smash burgers, loaded poutines, crispy fish &amp; chips,
          and everything in between. Open daily 11:00&nbsp;AM&nbsp;–&nbsp;7:00&nbsp;PM at 45 Dundas St.
        </p>
        {ONLINE_ORDERING_ENABLED ? (
          <Link
            href="/order"
            className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            }}
          >
            Order Online for Pickup →
          </Link>
        ) : (
          <div
            className="mt-5 mx-auto max-w-xl rounded-2xl px-5 py-4"
            style={{
              background: "oklch(0.22 0.02 30)",
              border: "1px solid oklch(0.62 0.22 38 / 0.45)",
            }}
          >
            <p className="font-bold text-foreground">{ORDERING_CLOSED_HEADING}</p>
            <p className="text-sm text-muted-foreground mt-1">{ORDERING_CLOSED_MSG}</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <div className="container pb-16 space-y-12">
        {MENU_CATEGORIES.map((cat) => (
          <section key={cat.id} id={cat.id} aria-labelledby={`${cat.id}-heading`} className="scroll-mt-20">
            <h2
              id={`${cat.id}-heading`}
              className="flex items-center gap-2 text-2xl sm:text-3xl mb-5 border-b border-border pb-2"
              style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.03em" }}
            >
              <span aria-hidden>{cat.emoji}</span>
              {cat.name}
            </h2>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3 overflow-hidden"
                >
                  {item.image && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight text-card-foreground">
                        {item.name}
                        {item.popular && (
                          <span
                            className="ml-2 align-middle text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
                            style={{ background: "oklch(0.62 0.22 38 / 0.18)", color: "oklch(0.82 0.16 48)" }}
                          >
                            Popular
                          </span>
                        )}
                      </h3>
                      <span className="font-bold text-primary whitespace-nowrap">{price(item.priceCents)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <section className="container pb-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {ONLINE_ORDERING_ENABLED
            ? "Prices in CAD. Item availability updates in real time on the order page."
            : "Prices in CAD. Ask at the window for today's specials and sold-out items."}
        </p>
        {ONLINE_ORDERING_ENABLED ? (
          <Link
            href="/order"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            }}
          >
            Start Your Order →
          </Link>
        ) : (
          <a
            href="https://maps.google.com/?q=45+Dundas+St,+Deseronto,+ON"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            }}
          >
            Find the Truck →
          </a>
        )}
      </section>
    </main>
  );
}
