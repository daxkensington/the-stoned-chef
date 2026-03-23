import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place Your Order | The Stoned Chef",
  description: "Complete your order for pickup from The Stoned Chef chip truck in Deseronto, ON.",
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
