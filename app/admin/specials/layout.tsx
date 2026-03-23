import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Specials | The Stoned Chef",
  robots: { index: false, follow: false },
};

export default function AdminSpecialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
