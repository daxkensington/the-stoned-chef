"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Nadine F.",
    rating: 5,
    text: "Best burger in town hands down! I stop every time I'm in the neighbourhood!",
    date: "2 weeks ago",
  },
  {
    name: "Mike T.",
    rating: 5,
    text: "The poutine is absolutely loaded. Cheese curds are fresh and the gravy is homemade. This is the real deal.",
    date: "1 month ago",
  },
  {
    name: "Sarah L.",
    rating: 5,
    text: "Coma Mac burger is insane. My kids love the chicken fingers. Best chip truck food we've ever had!",
    date: "3 weeks ago",
  },
  {
    name: "Dave R.",
    rating: 4,
    text: "Great fish and chips, nice and crispy. The jalapeño poutine is fire. Only wish they were open more days!",
    date: "1 month ago",
  },
  {
    name: "Lisa M.",
    rating: 5,
    text: "We drive 30 minutes just to eat here. The pulled pork poutine is out of this world. Worth every penny.",
    date: "2 months ago",
  },
  {
    name: "Chris B.",
    rating: 5,
    text: "Finally a chip truck that gets it right. Fresh ingredients, huge portions, and the nicest people running it.",
    date: "3 weeks ago",
  },
];

export function Reviews() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const review = REVIEWS[current];

  return (
    <section className="py-12 border-t border-border" style={{ background: "oklch(0.14 0.02 32)" }}>
      <div className="container max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-current"
                style={{ color: "oklch(0.82 0.18 75)" }}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground">4.8</span>
          <span className="text-sm text-muted-foreground">on Google</span>
        </div>

        <h2
          className="text-3xl sm:text-4xl font-black mb-8"
          style={{
            fontFamily: "var(--font-bangers), 'Bangers', cursive",
            letterSpacing: "0.04em",
            color: "oklch(0.97 0.01 60)",
          }}
        >
          What People Say
        </h2>

        <div className="relative">
          <Quote
            className="w-10 h-10 mx-auto mb-4"
            style={{ color: "oklch(0.62 0.22 38 / 0.3)" }}
          />

          <p
            className="text-lg sm:text-xl leading-relaxed mb-6 min-h-[80px]"
            style={{ color: "oklch(0.88 0.04 60)" }}
          >
            &quot;{review.text}&quot;
          </p>

          <div className="flex items-center justify-center gap-1 mb-1">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 fill-current"
                style={{ color: "oklch(0.82 0.18 75)" }}
              />
            ))}
          </div>
          <p className="font-bold text-foreground text-sm">{review.name}</p>
          <p className="text-xs text-muted-foreground">{review.date}</p>
        </div>

        {/* Dots + arrows */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => {
              setAutoplay(false);
              setCurrent((c) => (c - 1 + REVIEWS.length) % REVIEWS.length);
            }}
            aria-label="Previous review"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--color-secondary)", color: "var(--color-muted-foreground)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1.5">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setAutoplay(false);
                  setCurrent(i);
                }}
                aria-label={`Go to review ${i + 1}`}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background:
                    i === current ? "oklch(0.62 0.22 38)" : "oklch(0.30 0.02 30)",
                  transform: i === current ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => {
              setAutoplay(false);
              setCurrent((c) => (c + 1) % REVIEWS.length);
            }}
            aria-label="Next review"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--color-secondary)", color: "var(--color-muted-foreground)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
