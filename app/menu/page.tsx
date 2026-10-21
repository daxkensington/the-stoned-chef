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
  title: "Menu & Prices | The Stoned Chef — Deseronto & Napanee Chip Truck (Burgers, Poutine, Fish & Chips)",
  description: ONLINE_ORDERING_ENABLED
    ? "See the full menu & prices at The Stoned Chef (5 mins from Napanee off Hwy 401 at 45 Dundas St, Deseronto) — smash burgers, loaded poutines, crispy fish & chips, wraps, and kids' meals. Order online for pickup, open daily 11am–7pm."
    : "See the full menu & prices at The Stoned Chef (5 mins from Napanee off Hwy 401 at 45 Dundas St, Deseronto) — smash burgers, loaded poutines, crispy fish & chips, wraps, and kids' meals. Open daily 11am–7pm.",
  alternates: { canonical: "https://thestonedchef.ca/menu" },
  openGraph: {
    title: "The Stoned Chef Menu & Prices — Deseronto & Napanee Chip Truck",
    description: ONLINE_ORDERING_ENABLED
      ? "Smash burgers, loaded poutines, crispy fish & chips, and more. Order online for pickup (5 mins from Napanee off Hwy 401)."
      : "Smash burgers, loaded poutines, crispy fish & chips, and more. Open daily at 45 Dundas St, Deseronto (5 mins from Napanee).",
    url: "https://thestonedchef.ca/menu",
    type: "website",
  },
};

function price(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const menuJsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "The Stoned Chef Menu",
  url: "https://thestonedchef.ca/menu",
  mainEntityOfPage: "https://thestonedchef.ca/menu",
  inLanguage: "en-CA",
  hasMenuSection: MENU_CATEGORIES.map((cat) => ({
    "@type": "MenuSection",
    name: cat.name,
    hasMenuItem: cat.items.map((item) => ({
      "@type": "MenuItem",
      name: item.name,
      description: item.description,
      image: item.image ? `https://thestonedchef.ca${item.image}` : undefined,
      offers: {
        "@type": "Offer",
        price: (item.priceCents / 100).toFixed(2),
        priceCurrency: "CAD",
      },
    })),
  })),
};

const menuFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How far is The Stoned Chef chip truck from Napanee and Highway 401?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Stoned Chef is located at 45 Dundas Street in Deseronto, Ontario — about 5 minutes south of Highway 401 Exit 570 (Hwy 49) and 10–15 minutes west of Napanee via County Rd 2 or Hwy 401.",
      },
    },
    {
      "@type": "Question",
      name: "What are the most popular items on The Stoned Chef menu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Customer favourites include fresh-pressed smash burgers (Single, Double & Bacon Cheeseburger), hand-cut fries with St-Albert cheese curd poutines, crispy battered fish & chips, wraps, and kids' meals.",
      },
    },
  ],
};

export default function MenuPage() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([menuJsonLd, menuFaqJsonLd]) }}
      />
      {/* Header */}
      <section className="container pt-10 pb-6 text-center">
        <h1
          className="text-4xl sm:text-5xl mb-2"
          style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.04em" }}
        >
          Our Menu
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deseronto &amp; Napanee area&apos;s favourite chip truck — smash burgers, loaded poutines, crispy fish &amp; chips,
          and everything in between. Open daily 11:00&nbsp;AM&nbsp;–&nbsp;7:00&nbsp;PM at 45 Dundas St (5 mins west of Napanee off Hwy 401) on Highway 49 (just 5 minutes south of Highway 401 Exit 570).
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

      {/* Local Directions & Napanee / Hwy 401 FAQ */}
      <section className="container pb-12">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl mb-3"
            style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.03em" }}
          >
            Visiting from Napanee, Tyendinaga, Belleville, or Hwy 401?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Looking for the best chip truck, smash burgers, loaded poutine, or fish &amp; chips near Napanee and Deseronto? We&apos;re parked at <strong>45 Dundas Street, Deseronto, ON</strong> — just <strong>5 minutes off Highway 401 Exit 570 (Hwy 49 South)</strong> and a quick drive west of Napanee. Open daily 11:00&nbsp;AM&nbsp;–&nbsp;7:00&nbsp;PM with lots of free parking.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-secondary/40 p-4">
              <h3 className="font-bold text-foreground mb-1">From Napanee &amp; Greater Napanee</h3>
              <p className="text-muted-foreground">Take Hwy 401 West to Exit 570 (Hwy 49 South) or take County Rd 2 West straight into Deseronto to 45 Dundas St.</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <h3 className="font-bold text-foreground mb-1">From Belleville, Shannonville &amp; Hwy 401</h3>
              <p className="text-muted-foreground">Take Hwy 401 East to Exit 570 (Hwy 49 South) for 5 minutes, or follow Hwy 2 East through Tyendinaga Mohawk Territory to 45 Dundas St.</p>
            </div>
          </div>
        </div>
      </section>

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
