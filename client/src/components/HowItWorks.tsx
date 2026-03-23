"use client";

import { motion } from "framer-motion";
import { Smartphone, Clock, Truck } from "lucide-react";

const STEPS = [
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: "Order Online",
    description: "Pick your favourites from the menu and add them to your cart",
    number: "01",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: "Choose Pickup Time",
    description: "Select a 15-minute window that works for you",
    number: "02",
  },
  {
    icon: <Truck className="w-7 h-7" />,
    title: "Pick Up & Enjoy",
    description: "Grab your order fresh from the truck at 45 Dundas St",
    number: "03",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 relative overflow-hidden" style={{ background: "oklch(0.11 0.02 32)" }}>
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 100%, oklch(0.58 0.24 30 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="text-center mb-12">
          <p
            className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.62 0.22 38)" }}
          >
            Simple as 1-2-3
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black fire-text"
            style={{
              fontFamily: "var(--font-bangers), 'Bangers', cursive",
              letterSpacing: "0.04em",
              filter: "drop-shadow(0 2px 8px oklch(0.58 0.24 30 / 0.3))",
            }}
          >
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="text-center relative"
            >
              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px"
                  style={{ background: "linear-gradient(90deg, oklch(0.62 0.22 38 / 0.4), oklch(0.62 0.22 38 / 0.1))" }}
                />
              )}

              {/* Step number */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                style={{
                  background: "linear-gradient(135deg, oklch(0.58 0.24 30 / 0.15), oklch(0.68 0.22 45 / 0.15))",
                  border: "1px solid oklch(0.62 0.22 38 / 0.3)",
                  color: "oklch(0.70 0.20 45)",
                  boxShadow: "0 4px 20px oklch(0.58 0.24 30 / 0.1)",
                }}
              >
                {step.icon}
                <span
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
                    color: "white",
                    boxShadow: "0 2px 8px oklch(0.58 0.24 30 / 0.5)",
                  }}
                >
                  {step.number}
                </span>
              </div>

              <h3
                className="text-xl font-black mb-2"
                style={{
                  fontFamily: "var(--font-bangers), 'Bangers', cursive",
                  letterSpacing: "0.04em",
                  color: "oklch(0.97 0.01 60)",
                }}
              >
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: "oklch(0.65 0.04 60)" }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
