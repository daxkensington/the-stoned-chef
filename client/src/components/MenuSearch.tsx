"use client";

import { Search, X, Leaf, Wheat, Flame as SpicyIcon, Baby } from "lucide-react";
import type { DietaryTag } from "@shared/menu";

const TAG_CONFIG: Record<DietaryTag, { label: string; icon: React.ReactNode; color: string }> = {
  vegetarian: { label: "Vegetarian", icon: <Leaf className="w-3 h-3" />, color: "oklch(0.55 0.18 145)" },
  "gluten-free": { label: "GF", icon: <Wheat className="w-3 h-3" />, color: "oklch(0.60 0.15 75)" },
  spicy: { label: "Spicy", icon: <SpicyIcon className="w-3 h-3" />, color: "oklch(0.58 0.22 25)" },
  "kid-friendly": { label: "Kids", icon: <Baby className="w-3 h-3" />, color: "oklch(0.55 0.15 260)" },
};

interface MenuSearchProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeFilters: Set<DietaryTag>;
  onToggleFilter: (tag: DietaryTag) => void;
}

export function MenuSearch({ search, onSearchChange, activeFilters, onToggleFilter }: MenuSearchProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search the menu..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 rounded-xl pl-10 pr-10 text-sm"
          style={{
            background: "var(--color-secondary)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            outline: "none",
          }}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter tags */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(TAG_CONFIG) as DietaryTag[]).map((tag) => {
          const config = TAG_CONFIG[tag];
          const active = activeFilters.has(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleFilter(tag)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: active ? `color-mix(in oklch, ${config.color} 20%, transparent)` : "var(--color-secondary)",
                color: active ? config.color : "var(--color-muted-foreground)",
                border: `1px solid ${active ? `color-mix(in oklch, ${config.color} 40%, transparent)` : "var(--color-border)"}`,
              }}
            >
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DietaryBadges({ tags }: { tags?: DietaryTag[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1">
      {tags.map((tag) => {
        const config = TAG_CONFIG[tag];
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{
              background: `color-mix(in oklch, ${config.color} 15%, transparent)`,
              color: config.color,
            }}
            title={config.label}
          >
            {config.icon}
          </span>
        );
      })}
    </div>
  );
}
