import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bangers } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { ScrollProgress } from "@/components/ScrollProgress";
import "./globals.css";

// GA4 Measurement ID — public by design (visible in page source).
const GA_MEASUREMENT_ID = "G-M3RP59TZ7E";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bangers",
});

export const metadata: Metadata = {
  title: "The Stoned Chef | Deseronto's Favourite Chip Truck",
  description:
    "Order online from The Stoned Chef — smash burgers, loaded poutines, crispy fish & chips, and more. 45 Dundas St, Deseronto, ON. Open daily 11am-7pm.",
  metadataBase: new URL("https://thestonedchef.ca"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stoned Chef",
  },
  openGraph: {
    title: "The Stoned Chef",
    description: "Where we cure the munchies — Deseronto's favourite chip truck",
    type: "website",
    url: "https://thestonedchef.ca",
  },
};

// Structured data for search engines / Google Business — keep hours in sync
// with OpenStatus and the customer-facing hours lines (open daily 11am–7pm).
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "The Stoned Chef",
  description: "Deseronto's favourite chip truck — smash burgers, loaded poutines, crispy fish & chips, and more.",
  url: "https://thestonedchef.ca",
  telephone: "+1-343-337-5810",
  servesCuisine: ["Burgers", "Poutine", "Fish & Chips", "Comfort Food"],
  priceRange: "$$",
  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663152852200/C7iRCrsUdcotHueyd4W2GL/truck-hero-clean_f3681cb6.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "45 Dundas Street",
    addressLocality: "Deseronto",
    addressRegion: "ON",
    postalCode: "K0K 1X0",
    addressCountry: "CA",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "11:00",
      closes: "19:00",
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#c44d18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bangers.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
        <Script src="https://web.squarecdn.com/v1/square.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Providers>
          <ScrollProgress />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
