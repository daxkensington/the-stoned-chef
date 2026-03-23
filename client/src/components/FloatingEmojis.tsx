"use client";

const EMOJIS = ["🍔", "🍟", "🧀", "🔥", "🌭", "🍗", "🐟", "🥤"];

export function FloatingEmojis() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {EMOJIS.map((emoji, i) => (
        <span
          key={i}
          className="floating-emoji"
          style={{
            left: `${10 + i * 12}%`,
            bottom: "-2rem",
            "--duration": `${14 + i * 3}s`,
            "--delay": `${i * 2}s`,
          } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
