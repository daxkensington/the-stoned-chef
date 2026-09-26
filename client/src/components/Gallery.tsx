"use client";

import { useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const galleryItems = [
  {
    src: "/food/gallery-1.jpg",
    alt: "Classic Poutine",
    label: "Classic Poutine",
    category: "Fries & Poutine",
  },
  {
    src: "/food/gallery-2.jpg",
    alt: "Smash Burger",
    label: "Smash Burger",
    category: "Burgers",
  },
  {
    src: "/food/gallery-3.jpg",
    alt: "Crispy Chicken Strips",
    label: "Crispy Chicken Strips",
    category: "Chicken",
  },
  {
    src: "/food/fries-hero.jpg",
    alt: "Loaded Cheese Fries",
    label: "Loaded Cheese Fries",
    category: "Fries & Poutine",
  },
  {
    src: "/food/onion-rings.jpg",
    alt: "Onion Rings",
    label: "Onion Rings",
    category: "Appetizers",
  },
  {
    src: "/food/fish-hero.jpg",
    alt: "Fish & Chips",
    label: "Fish & Chips",
    category: "Fish & Chips",
  },
  {
    src: "/food/sausage-hero.jpg",
    alt: "Grilled Sausage",
    label: "Grilled Sausage",
    category: "Sausages",
  },
  {
    src: "/food/hot-dog.jpg",
    alt: "Classic Hot Dog",
    label: "Classic Hot Dog",
    category: "Kids Menu",
  },
  {
    src: "/food/cheese-curds.jpg",
    alt: "Deep Fried Cheese Curds",
    label: "Deep Fried Cheese Curds",
    category: "Appetizers",
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState<(typeof galleryItems)[number] | null>(null);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const openLightbox = (item: (typeof galleryItems)[number], opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setSelected(item);
    setOpen(true);
  };

  return (
    <section className="py-16" id="gallery" style={{ background: "oklch(0.10 0.015 28)" }}>
      <div className="container mb-10 text-center">
        <p className="text-orange-500 font-semibold uppercase tracking-widest text-sm mb-2">
          Fresh From The Truck
        </p>
        <h2
          className="text-4xl md:text-5xl font-black uppercase fire-text"
          style={{
            fontFamily: "var(--font-bangers), 'Bangers', cursive",
            letterSpacing: "0.05em",
            filter: "drop-shadow(0 2px 8px oklch(0.58 0.24 30 / 0.3))",
          }}
        >
          Food Gallery
        </h2>
        <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
          Every basket made fresh to order. This is what&apos;s waiting for you at 45 Dundas St, Deseronto.
        </p>
        <div className="w-16 h-1 bg-orange-500 mx-auto mt-4 rounded-full" />
      </div>

      <div className="container">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {galleryItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label={`View ${item.label} full size`}
              onClick={(e) => openLightbox(item, e.currentTarget)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={800}
                height={600}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="flex items-center justify-between">
                  <span className="block">
                    <span className="block text-orange-400 text-xs font-semibold uppercase tracking-widest">
                      {item.category}
                    </span>
                    <span
                      className="block text-white text-xl font-black uppercase"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      {item.label}
                    </span>
                  </span>
                  <span className="bg-orange-500 rounded-full p-2" aria-hidden="true">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[95vh] overflow-y-auto border-border"
          style={{ background: "oklch(0.10 0.015 28)" }}
          onCloseAutoFocus={(e) => {
            if (openerRef.current) {
              e.preventDefault();
              openerRef.current.focus();
            }
          }}
        >
          {selected && (
            <>
              <SheetHeader className="mb-4 px-6">
                <SheetTitle
                  className="text-center text-white text-2xl font-black uppercase"
                  style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em" }}
                >
                  {selected.label}
                </SheetTitle>
                <SheetDescription className="text-orange-400 text-center">
                  {selected.category}
                </SheetDescription>
              </SheetHeader>
              <div className="max-w-4xl w-full mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.src}
                  alt={selected.alt}
                  className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
                />
                {/* Lightbox uses raw img for full-res viewing */}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
