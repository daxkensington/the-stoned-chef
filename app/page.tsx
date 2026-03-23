"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MENU_CATEGORIES } from "@shared/menu";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Phone, Star, ChevronRight, Flame } from "lucide-react";
import { toast } from "sonner";
import { DailySpecials } from "@/components/DailySpecials";
import Gallery from "@/components/Gallery";

const TRUCK_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/truck-hero-clean_f3681cb6.png";
const POUTINE_HIGHRES =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/poutine-highres_129aa80e.jpeg";
const BURGER_JALAPENO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/burger-jalapeno_34d85813.jpg";
const BURGER_COMPOSITE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/burger-composite_fd6271e2.jpg";
const POUTINE_CLOSE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/poutine-close_d11b2d79.jpeg";

const CATEGORY_IMAGES: Record<string, string> = {
  burgers: BURGER_JALAPENO,
  "fries-poutine": POUTINE_HIGHRES,
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("burgers");
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, totalItems, totalCents } = useCart();
  const router = useRouter();

  const activeMenu = MENU_CATEGORIES.find((c) => c.id === activeCategory);

  const handleAddItem = (item: {
    id: string;
    name: string;
    category: string;
    priceCents: number;
  }) => {
    addItem(item);
    toast.success(`${item.name} added!`, {
      duration: 1500,
      style: {
        background: "oklch(0.18 0.015 30)",
        border: "1px solid oklch(0.62 0.22 38 / 0.5)",
        color: "oklch(0.97 0.01 60)",
      },
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ minHeight: "85vh" }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${TRUCK_HERO})`, backgroundPosition: "center 35%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, oklch(0.10 0.02 25 / 0.92) 0%, oklch(0.10 0.02 25 / 0.75) 40%, oklch(0.10 0.02 25 / 0.40) 65%, oklch(0.10 0.02 25 / 0.15) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-background))" }}
        />

        <div
          className="container relative flex flex-col justify-center"
          style={{ minHeight: "85vh", paddingTop: "2rem", paddingBottom: "4rem" }}
        >
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{
                background: "oklch(0.62 0.22 38 / 0.20)",
                color: "oklch(0.90 0.16 50)",
                border: "1px solid oklch(0.62 0.22 38 / 0.45)",
              }}
            >
              <Flame className="w-3 h-3" />
              Open Thu – Sun · 11am – 7pm
            </div>

            <h1
              className="leading-none mb-4"
              style={{
                fontFamily: "var(--font-bangers), 'Bangers', cursive",
                letterSpacing: "0.04em",
                fontSize: "clamp(3.5rem, 10vw, 6.5rem)",
              }}
            >
              <span
                className="block"
                style={{
                  color: "oklch(0.97 0.01 60)",
                  textShadow: "0 2px 20px oklch(0 0 0 / 0.8)",
                }}
              >
                THE
              </span>
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.80 0.20 50) 0%, oklch(0.62 0.24 32) 60%, oklch(0.50 0.22 25) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 2px 8px oklch(0 0 0 / 0.6))",
                }}
              >
                STONED CHEF
              </span>
            </h1>

            <p
              className="text-xl font-bold mb-2"
              style={{ color: "oklch(0.90 0.12 55)", textShadow: "0 1px 8px oklch(0 0 0 / 0.8)" }}
            >
              Where we cure the munchies
            </p>
            <p
              className="flex items-center gap-1.5 text-sm mb-6"
              style={{ color: "oklch(0.80 0.04 60)", textShadow: "0 1px 4px oklch(0 0 0 / 0.8)" }}
            >
              <MapPin
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.62 0.22 38)" }}
              />
              45 Dundas St, Deseronto, ON
            </p>

            <div className="flex items-center gap-2 mb-8">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-current"
                    style={{ color: "oklch(0.82 0.18 75)" }}
                  />
                ))}
              </div>
              <span
                className="text-sm font-bold"
                style={{
                  color: "oklch(0.97 0.01 60)",
                  textShadow: "0 1px 4px oklch(0 0 0 / 0.8)",
                }}
              >
                4.8
              </span>
              <span
                className="text-sm"
                style={{
                  color: "oklch(0.75 0.04 60)",
                  textShadow: "0 1px 4px oklch(0 0 0 / 0.8)",
                }}
              >
                · Deseronto&apos;s favourite chip truck
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-13 px-7 text-base font-bold rounded-xl shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                  color: "white",
                  boxShadow: "0 4px 24px oklch(0.58 0.24 30 / 0.5)",
                }}
                onClick={() =>
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Order Now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-7 text-base font-bold rounded-xl"
                style={{
                  background: "oklch(0.10 0.02 25 / 0.60)",
                  border: "1px solid oklch(0.97 0.01 60 / 0.35)",
                  color: "oklch(0.97 0.01 60)",
                  backdropFilter: "blur(8px)",
                }}
                onClick={() =>
                  document.getElementById("info")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOD PHOTO STRIP */}
      <section
        className="py-8 border-y border-border overflow-hidden"
        style={{ background: "oklch(0.15 0.02 30)" }}
      >
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                img: BURGER_COMPOSITE,
                label: "Smash Burgers",
                sub: "Made fresh to order",
                pos: "center center",
              },
              {
                img: POUTINE_HIGHRES,
                label: "Loaded Poutine",
                sub: "Cheese curds & gravy",
                pos: "center 40%",
              },
              {
                img: POUTINE_CLOSE,
                label: "Poutine & Fries",
                sub: "Crispy hand-cut fries",
                pos: "center center",
              },
            ].map(({ img, label, sub, pos }) => (
              <div
                key={label}
                className="relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{ aspectRatio: "4/3" }}
                onClick={() =>
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: pos }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, oklch(0.10 0.02 25 / 0.80) 0%, transparent 60%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bold text-sm" style={{ color: "oklch(0.97 0.01 60)" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.75 0.04 60)" }}>
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-10 sm:py-14">
        <div className="container">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <h2
              className="text-4xl sm:text-5xl font-black leading-none"
              style={{
                fontFamily: "var(--font-bangers), 'Bangers', cursive",
                letterSpacing: "0.04em",
                color: "oklch(0.97 0.01 60)",
              }}
            >
              Our Menu
            </h2>
            <p className="text-muted-foreground text-sm">
              All burgers dressed with onion, pickle, mustard & ketchup
            </p>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-3 mb-6"
            style={{ scrollbarWidth: "none" }}
          >
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
                style={
                  activeCategory === cat.id
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                        color: "white",
                        boxShadow: "0 2px 12px oklch(0.58 0.24 30 / 0.4)",
                      }
                    : {
                        background: "var(--color-secondary)",
                        color: "var(--color-muted-foreground)",
                      }
                }
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {CATEGORY_IMAGES[activeCategory] && (
            <div className="relative rounded-2xl overflow-hidden mb-6" style={{ height: "180px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CATEGORY_IMAGES[activeCategory]}
                alt={activeMenu?.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: activeCategory === "burgers" ? "center 40%" : "center center",
                }}
              />
              <div
                className="absolute inset-0 flex items-end p-5"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0.10 0.02 25 / 0.85) 0%, transparent 60%)",
                }}
              >
                <h3
                  className="text-3xl font-black"
                  style={{
                    fontFamily: "var(--font-bangers), 'Bangers', cursive",
                    letterSpacing: "0.04em",
                    color: "white",
                  }}
                >
                  {activeMenu?.emoji} {activeMenu?.name}
                </h3>
              </div>
            </div>
          )}

          {activeMenu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeMenu.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 2px 12px oklch(0 0 0 / 0.25)",
                  }}
                >
                  {item.image && (
                    <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      {item.popular && (
                        <div
                          className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: "oklch(0.58 0.24 30 / 0.90)",
                            color: "white",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          Popular
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-foreground text-base leading-tight">
                            {item.name}
                          </h3>
                          {item.popular && !item.image && (
                            <Badge
                              className="text-xs px-1.5 py-0 rounded-md flex-shrink-0 font-bold"
                              style={{
                                background: "oklch(0.62 0.22 38 / 0.18)",
                                color: "oklch(0.82 0.16 48)",
                                border: "1px solid oklch(0.62 0.22 38 / 0.35)",
                              }}
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span
                        className="font-black text-2xl"
                        style={{
                          color: "oklch(0.70 0.20 45)",
                          fontFamily: "var(--font-bangers), 'Bangers', cursive",
                          letterSpacing: "0.02em",
                        }}
                      >
                        ${(item.priceCents / 100).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddItem(item)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                          color: "white",
                          boxShadow: "0 2px 8px oklch(0.58 0.24 30 / 0.35)",
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <DailySpecials />
      <Gallery />

      {/* ABOUT */}
      <section
        className="py-10 border-t border-border"
        style={{ background: "oklch(0.15 0.02 30)" }}
      >
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BURGER_JALAPENO}
                alt="The Stoned Chef food truck at 45 Dundas St, Deseronto"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 40%" }}
              />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                style={{
                  background: "oklch(0.62 0.22 38 / 0.15)",
                  color: "oklch(0.82 0.16 48)",
                  border: "1px solid oklch(0.62 0.22 38 / 0.35)",
                }}
              >
                <Flame className="w-3 h-3" />
                Deseronto&apos;s Chip Truck
              </div>
              <h2
                className="text-4xl sm:text-5xl font-black leading-none mb-4"
                style={{
                  fontFamily: "var(--font-bangers), 'Bangers', cursive",
                  letterSpacing: "0.04em",
                  color: "oklch(0.97 0.01 60)",
                }}
              >
                Best Burger &<br />
                <span style={{ color: "oklch(0.70 0.20 45)" }}>Poutine Around</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We&apos;re a chip truck parked right in the heart of Deseronto, serving up loaded
                poutines, smash burgers, crispy fish & chips, and everything in between. Where all
                munchie cravings are met.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-current"
                      style={{ color: "oklch(0.82 0.18 75)" }}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">4.8 on Google</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                &quot;Best burger in town hands down! I stop every time I&apos;m in the
                neighbourhood!&quot; — Nadine F.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FIND US */}
      <section id="info" className="py-10 border-t border-border">
        <div className="container">
          <h2
            className="text-4xl sm:text-5xl font-black mb-6"
            style={{
              fontFamily: "var(--font-bangers), 'Bangers', cursive",
              letterSpacing: "0.04em",
              color: "oklch(0.97 0.01 60)",
            }}
          >
            Find Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <MapPin className="w-5 h-5" />,
                title: "Location",
                lines: ["45 Dundas Street", "Deseronto, ON K0K 1X0"],
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: "Hours",
                lines: ["Thursday – Sunday", "11:00 AM – 7:00 PM"],
              },
              {
                icon: <Phone className="w-5 h-5" />,
                title: "Phone",
                lines: ["(613) 328-4766"],
              },
            ].map((info) => (
              <div
                key={info.title}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "oklch(0.62 0.22 38 / 0.15)",
                    color: "oklch(0.70 0.20 45)",
                  }}
                >
                  {info.icon}
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">{info.title}</p>
                  {info.lines.map((line) => (
                    <p key={line} className="text-muted-foreground text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t border-border py-8"
        style={{ background: "oklch(0.12 0.015 28)" }}
      >
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p
                className="font-black text-xl"
                style={{
                  fontFamily: "var(--font-bangers), 'Bangers', cursive",
                  letterSpacing: "0.06em",
                  color: "oklch(0.70 0.20 45)",
                }}
              >
                THE STONED CHEF
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Where we cure the munchies · Deseronto, ON
              </p>
            </div>
            <div className="text-center sm:text-right text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} The Stoned Chef</p>
              <p className="text-xs mt-0.5">Payment accepted at pickup · Thu–Sun 11am–7pm</p>
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CART */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full h-14 rounded-2xl flex items-center justify-between px-5 font-bold text-base shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.24 28) 0%, oklch(0.65 0.22 45) 100%)",
              color: "white",
              boxShadow: "0 8px 32px oklch(0.55 0.24 28 / 0.6)",
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: "white", color: "oklch(0.55 0.24 28)" }}
              >
                {totalItems}
              </span>
              View Order
            </span>
            <span>${(totalCents / 100).toFixed(2)}</span>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
