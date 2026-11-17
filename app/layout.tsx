import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bangers } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { ScrollProgress } from "@/components/ScrollProgress";
import "./globals.css";
import { ONLINE_ORDERING_ENABLED } from "@shared/const";
import {
  HOMEPAGE_TITLE,
  RESTAURANT_JSON_LD,
  getHomepageDescription,
  serializeJsonLd,
} from "@shared/homepage-seo";

// GA4 Measurement ID — public by design (visible in page source).
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SPKGRFZPY8";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bangers",
});

export const metadata: Metadata = {
  title: HOMEPAGE_TITLE,
  description: getHomepageDescription(ONLINE_ORDERING_ENABLED),
  metadataBase: new URL("https://thestonedchef.ca"),
  alternates: { canonical: "https://thestonedchef.ca" },
  keywords: [
    "The Stoned Chef",
    "Deseronto restaurants",
    "restaurants in Deseronto",
    "restaurants in Deseronto Ontario",
    "chip truck Deseronto",
    "chip truck Napanee",
    "restaurants near Napanee",
    "best poutine Deseronto",
    "smash burgers Deseronto",
    "food truck Tyendinaga",
    "fish and chips Deseronto",
    "food near me Deseronto",
    "food near me",
    "restaurants near me",
    "chip truck near me",
    "chip truck Tyendinaga",
    "45 Dundas Street Deseronto",
  ],
  icons: {
    icon: [{ url: "/icon-192.png", type: "image/png" }],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stoned Chef",
  },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: getHomepageDescription(ONLINE_ORDERING_ENABLED),
    type: "website",
    url: "https://thestonedchef.ca",
    siteName: "The Stoned Chef",
    locale: "en_CA",
    images: [
      {
        url: "/og-image.jpg",
        width: 1280,
        height: 720,
        alt: "Bacon cheeseburger, loaded poutine, hand-cut fries, and fish & chips from The Stoned Chef",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: getHomepageDescription(ONLINE_ORDERING_ENABLED),
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#c44d18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bangers.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(RESTAURANT_JSON_LD) }}
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
        {ONLINE_ORDERING_ENABLED && (
          <Script src="https://web.squarecdn.com/v1/square.js" strategy="beforeInteractive" />
        )}
      </head>
      <body>
        <Providers>
          <ScrollProgress />
          <Navbar />
          {children}
        </Providers>
              <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
