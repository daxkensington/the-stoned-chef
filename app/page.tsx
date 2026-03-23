"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MENU_CATEGORIES } from "@shared/menu";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Phone, Star, ChevronRight, Flame, Ban } from "lucide-react";
import { toast } from "sonner";
import { DailySpecials } from "@/components/DailySpecials";
import Gallery from "@/components/Gallery";
import { OpenStatus } from "@/components/OpenStatus";
import { EmailCapture } from "@/components/EmailCapture";
import { OrderHistory } from "@/components/OrderHistory";
import { PunchCard } from "@/components/PunchCard";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { CustomizeModal } from "@/components/CustomizeModal";
import { hasCustomizations } from "@shared/customizations";
import type { MenuItem } from "@shared/menu";
import { Reviews } from "@/components/Reviews";
import { MenuSearch, DietaryBadges } from "@/components/MenuSearch";
import type { DietaryTag } from "@shared/menu";
import { FloatingEmojis } from "@/components/FloatingEmojis";
import { SectionReveal } from "@/components/SectionReveal";

const TRUCK_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/truck-hero-clean_f3681cb6.png";
const POUTINE_HIGHRES = "/food/poutine-hero.jpg";
const BURGER_JALAPENO = "/food/burger-hero.jpg";
const BURGER_COMPOSITE = "/food/bacon-cheese.jpg";
const POUTINE_CLOSE = "/food/pulled-pork-poutine.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  burgers: BURGER_JALAPENO,
  "fries-poutine": POUTINE_HIGHRES,
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("burgers");
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, totalItems, totalCents } = useCart();
  const router = useRouter();
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState<Set<DietaryTag>>(new Set());

  const toggleDietaryFilter = (tag: DietaryTag) => {
    setDietaryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const { data: soldOutIds = [] } = trpc.soldOut.list.useQuery();
  const activeMenu = MENU_CATEGORIES.find((c) => c.id === activeCategory);

  const filteredItems = activeMenu?.items.filter((item) => {
    if (menuSearch) {
      const q = menuSearch.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (dietaryFilters.size > 0) {
      const itemTags = new Set(item.tags || []);
      for (const filter of dietaryFilters) {
        if (!itemTags.has(filter)) return false;
      }
    }
    return true;
  }) ?? [];

  const handleAddItem = (item: MenuItem) => {
    if (hasCustomizations(item.category)) {
      setCustomizeItem(item);
    } else {
      addItem(item);
      toast.success(`${item.name} added!`, {
        duration: 1500,
        style: {
          background: "oklch(0.18 0.015 30)",
          border: "1px solid oklch(0.62 0.22 38 / 0.5)",
          color: "oklch(0.97 0.01 60)",
        },
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ minHeight: "85vh" }}>
        <FloatingEmojis />
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
            <div className="mb-6">
              <OpenStatus />
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
                className="block fire-text"
                style={{
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
      <SectionReveal>
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
                <Image
                  src={img}
                  alt={label}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: pos }}
                  sizes="(max-width: 640px) 50vw, 33vw"
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
      </SectionReveal>

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
              <Image
                src={CATEGORY_IMAGES[activeCategory]}
                alt={activeMenu?.name || "Category"}
                width={1200}
                height={400}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: activeCategory === "burgers" ? "center 40%" : "center center",
                }}
                sizes="100vw"
                priority
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

          <MenuSearch
            search={menuSearch}
            onSearchChange={setMenuSearch}
            activeFilters={dietaryFilters}
            onToggleFilter={toggleDietaryFilter}
          />

          {activeMenu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item, idx) => {
                const isSoldOut = soldOutIds.includes(item.id);
                return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`rounded-2xl overflow-hidden flex flex-col card-glow ${isSoldOut ? "opacity-60" : ""}`}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 2px 12px oklch(0 0 0 / 0.25)",
                  }}
                >
                  {item.image && (
                    <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                      {isSoldOut && (
                        <div
                          className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                          style={{ background: "oklch(0.25 0.02 30 / 0.90)", color: "oklch(0.75 0.04 60)", backdropFilter: "blur(4px)" }}
                        >
                          <Ban className="w-3 h-3" /> Sold Out
                        </div>
                      )}
                      {item.popular && !isSoldOut && (
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
                        <DietaryBadges tags={item.tags} />
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
                        onClick={() => !isSoldOut && handleAddItem(item)}
                        disabled={isSoldOut}
                        aria-label={isSoldOut ? `${item.name} is sold out` : `Add ${item.name} to cart — $${(item.priceCents / 100).toFixed(2)}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background: isSoldOut
                            ? "oklch(0.30 0.02 30)"
                            : "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.68 0.22 45) 100%)",
                          color: "white",
                          boxShadow: isSoldOut ? "none" : "0 2px 8px oklch(0.58 0.24 30 / 0.35)",
                        }}
                      >
                        {isSoldOut ? (
                          <>
                            <Ban className="w-4 h-4" />
                            Sold Out
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ORDER AGAIN */}
      <OrderHistory />

      {/* PUNCH CARD */}
      <PunchCard />

      <DailySpecials />
      <Gallery />

      {/* REVIEWS */}
      <Reviews />

      {/* ABOUT */}
      <SectionReveal>
      <section
        className="py-10 border-t border-border wave-divider"
        style={{ background: "oklch(0.15 0.02 30)" }}
      >
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
              <Image
                src={BURGER_JALAPENO}
                alt="The Stoned Chef food truck at 45 Dundas St, Deseronto"
                width={800}
                height={500}
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 40%" }}
                sizes="(max-width: 768px) 100vw, 50vw"
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
      </SectionReveal>

      {/* FIND US */}
      <SectionReveal>
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

          {/* Google Maps */}
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2842.5!2d-77.0474!3d44.1983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cd41f0c7b0b0b0b%3A0x0!2s45+Dundas+St%2C+Deseronto%2C+ON!5e0!3m2!1sen!2sca!4v1"
              width="100%"
              height="250"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="The Stoned Chef location - 45 Dundas St, Deseronto, ON"
            />
          </div>
        </div>
      </section>

      </SectionReveal>

      {/* EMAIL CAPTURE */}
      <EmailCapture />

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
            <div className="flex flex-col items-center sm:items-end gap-3">
              {/* Social Links */}
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/thestonedchefdeseronto"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Facebook"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "oklch(0.22 0.02 30)", color: "oklch(0.65 0.04 60)" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/thestonedchef_"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "oklch(0.22 0.02 30)", color: "oklch(0.65 0.04 60)" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a
                  href="https://www.tiktok.com/@thestonedchef"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on TikTok"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "oklch(0.22 0.02 30)", color: "oklch(0.65 0.04 60)" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.13a8.16 8.16 0 005.58 2.2v-3.46a4.85 4.85 0 01-3-.6z"/></svg>
                </a>
              </div>
              <div className="text-center sm:text-right text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} The Stoned Chef</p>
                <p className="text-xs mt-0.5">Payment accepted at pickup · Thu–Sun 11am–7pm</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CART */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`View order — ${totalItems} items, $${(totalCents / 100).toFixed(2)}`}
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
      <CustomizeModal
        item={customizeItem}
        open={!!customizeItem}
        onClose={() => setCustomizeItem(null)}
      />
    </div>
  );
}
