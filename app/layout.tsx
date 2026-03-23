import type { Metadata } from "next";
import { Bangers } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bangers",
});

export const metadata: Metadata = {
  title: "The Stoned Chef | Deseronto's Favourite Chip Truck",
  description:
    "Order online from The Stoned Chef — smash burgers, loaded poutines, crispy fish & chips, and more. 45 Dundas St, Deseronto, ON. Open Thu-Sun 11am-7pm.",
  openGraph: {
    title: "The Stoned Chef",
    description: "Where we cure the munchies — Deseronto's favourite chip truck",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bangers.variable}>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
