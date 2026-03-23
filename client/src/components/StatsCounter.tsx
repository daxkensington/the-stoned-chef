"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShoppingBag, Star, UtensilsCrossed, Users } from "lucide-react";

const STATS = [
  { icon: <ShoppingBag className="w-6 h-6" />, value: 500, suffix: "+", label: "Orders Served" },
  { icon: <Star className="w-6 h-6" />, value: 4.8, suffix: "", label: "Google Rating", decimals: 1 },
  { icon: <UtensilsCrossed className="w-6 h-6" />, value: 40, suffix: "+", label: "Menu Items" },
  { icon: <Users className="w-6 h-6" />, value: 100, suffix: "%", label: "Satisfaction" },
];

function AnimatedNumber({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {decimals > 0 ? current.toFixed(decimals) : Math.round(current)}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  return (
    <section className="py-14 relative" style={{ background: "oklch(0.13 0.01 30)" }}>
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 38 / 0.3), transparent)" }}
      />
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{
                  background: "oklch(0.62 0.22 38 / 0.12)",
                  color: "oklch(0.70 0.20 45)",
                  border: "1px solid oklch(0.62 0.22 38 / 0.2)",
                }}
              >
                {stat.icon}
              </div>
              <p
                className="text-4xl font-black mb-1"
                style={{
                  fontFamily: "var(--font-bangers), 'Bangers', cursive",
                  letterSpacing: "0.02em",
                  color: "oklch(0.97 0.01 60)",
                }}
              >
                <AnimatedNumber value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.04 60)" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
