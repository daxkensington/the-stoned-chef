"use client";

import { QrCode } from "lucide-react";

interface OrderQRProps {
  orderNumber: string;
}

export function OrderQR({ orderNumber }: OrderQRProps) {
  // Generate QR code using a simple canvas-based approach
  // Using Google Charts API for simplicity (publicly available, no API key needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderNumber)}&bgcolor=1a1410&color=f5f0eb`;

  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <QrCode className="w-4 h-4" style={{ color: "oklch(0.62 0.22 38)" }} />
        <h3 className="font-bold text-foreground text-sm">Show at Pickup</h3>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={`QR code for order ${orderNumber}`}
        width={160}
        height={160}
        className="mx-auto rounded-xl"
        style={{ background: "oklch(0.13 0.01 30)" }}
      />
      <p className="text-xs text-muted-foreground mt-3">
        Show this QR code when picking up your order
      </p>
    </div>
  );
}
