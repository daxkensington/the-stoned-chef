"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";

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
    src: "/food/pulled-pork-poutine.jpg",
    alt: "Pulled Pork Poutine",
    label: "Pulled Pork Poutine",
    category: "Fries & Poutine",
  },
];

export default function Gallery() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState<string>("");

  const openLightbox = (src: string, label: string) => {
    setLightboxSrc(src);
    setLightboxLabel(label);
  };

  const closeLightbox = () => {
    setLightboxSrc(null);
  };

  return (
    <section className="py-16 bg-zinc-950" id="gallery">
      <div className="container mb-10 text-center">
        <p className="text-orange-500 font-semibold uppercase tracking-widest text-sm mb-2">
          Fresh From The Truck
        </p>
        <h2
          className="text-4xl md:text-5xl font-black uppercase text-white"
          style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em" }}
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
            <div
              key={idx}
              className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer"
              onClick={() => openLightbox(item.src, item.label)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={800}
                height={600}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
                      {item.category}
                    </p>
                    <p
                      className="text-white text-xl font-black uppercase"
                      style={{ fontFamily: "'Bangers', cursive" }}
                    >
                      {item.label}
                    </p>
                  </div>
                  <div className="bg-orange-500 rounded-full p-2">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 transition-colors z-10"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt={lightboxLabel}
              className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
            />
            {/* Lightbox uses raw img for full-res viewing */}
            <p
              className="text-center text-white text-2xl font-black uppercase mt-4"
              style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em" }}
            >
              {lightboxLabel}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
