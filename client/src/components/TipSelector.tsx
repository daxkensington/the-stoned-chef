"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

const TIP_PRESETS = [
  { label: "10%", multiplier: 0.10 },
  { label: "15%", multiplier: 0.15 },
  { label: "20%", multiplier: 0.20 },
];

interface TipSelectorProps {
  subtotalCents: number;
  tipCents: number;
  onTipChange: (cents: number) => void;
}

export function TipSelector({ subtotalCents, tipCents, onTipChange }: TipSelectorProps) {
  const [customTip, setCustomTip] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const selectedPreset = TIP_PRESETS.find(
    (p) => Math.round(subtotalCents * p.multiplier) === tipCents && !isCustom
  );

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-foreground">Add a Tip</h2>
        <span className="text-xs text-muted-foreground ml-auto">Optional — goes to the crew</span>
      </div>
      <div className="px-5 py-4">
        <div className="flex gap-2 mb-3">
          {TIP_PRESETS.map((preset) => {
            const amount = Math.round(subtotalCents * preset.multiplier);
            const active = selectedPreset === preset && !isCustom;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setIsCustom(false);
                  setCustomTip("");
                  onTipChange(amount);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active
                    ? "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))"
                    : "var(--color-secondary)",
                  color: active ? "white" : "var(--color-muted-foreground)",
                  border: `1px solid ${active ? "oklch(0.62 0.22 38 / 0.5)" : "var(--color-border)"}`,
                }}
              >
                <div>{preset.label}</div>
                <div className="text-xs opacity-70">${(amount / 100).toFixed(2)}</div>
              </button>
            );
          })}
          <button
            onClick={() => {
              if (isCustom && tipCents > 0) {
                setIsCustom(false);
                setCustomTip("");
                onTipChange(0);
              } else {
                setIsCustom(true);
                onTipChange(0);
              }
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isCustom
                ? "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))"
                : "var(--color-secondary)",
              color: isCustom ? "white" : "var(--color-muted-foreground)",
              border: `1px solid ${isCustom ? "oklch(0.62 0.22 38 / 0.5)" : "var(--color-border)"}`,
            }}
          >
            Custom
          </button>
          {tipCents > 0 && (
            <button
              onClick={() => {
                setIsCustom(false);
                setCustomTip("");
                onTipChange(0);
              }}
              className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "var(--color-secondary)",
                color: "var(--color-muted-foreground)",
                border: "1px solid var(--color-border)",
              }}
            >
              None
            </button>
          )}
        </div>

        {isCustom && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
            <input
              type="number"
              min="0"
              step="0.25"
              placeholder="0.00"
              value={customTip}
              onChange={(e) => {
                setCustomTip(e.target.value);
                const val = parseFloat(e.target.value);
                onTipChange(isNaN(val) ? 0 : Math.round(val * 100));
              }}
              className="w-full h-11 rounded-xl pl-8 text-sm"
              style={{
                background: "var(--color-input)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                outline: "none",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
