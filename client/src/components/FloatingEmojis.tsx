"use client";

// Everything on the menu — the full spread
const EMOJIS = [
  "🍔", "🍟", "🧀", "🌭", "🍗", "🐟", "🥤",
  "🥓", "🍖", "🧅", "🌯", "🥤", "💧", "🍔",
  "🍟", "🔥", "🌶️", "🧂", "🍗", "🐟", "🌭",
];

export function FloatingEmojis() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {EMOJIS.map((emoji, i) => {
        // Spread them across the full width with some randomness
        const left = (i * 4.5 + (i % 3) * 2.5) % 95;
        const duration = 10 + (i % 7) * 2.5;
        const delay = i * 1.1;
        const size = 1.8 + (i % 4) * 0.4; // 1.8rem to 3rem

        return (
          <span
            key={i}
            className="floating-emoji"
            style={{
              left: `${left}%`,
              bottom: "-3rem",
              fontSize: `${size}rem`,
              "--duration": `${duration}s`,
              "--delay": `${delay}s`,
            } as React.CSSProperties}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}
