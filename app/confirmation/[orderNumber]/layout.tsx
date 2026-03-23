import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | The Stoned Chef",
  description: "Your order has been placed! Check your pickup details.",
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
