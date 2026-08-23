import type { Metadata, Viewport } from "next";

// Installs the admin panel as its own home-screen app, separate from the
// storefront. This site's admin had no layout, so there was no server component
// that could export metadata to attach the admin manifest.
export const metadata: Metadata = {
  title: "The Stoned Chef Admin",
  robots: "noindex, nofollow",
  manifest: "/admin-manifest.json",
  appleWebApp: { capable: true, title: "Chef Admin", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin-icon-192.png" },
  // Next 16 emits only mobile-web-app-capable; pre-iOS-16.4 needs the apple- one
  // or the home-screen icon opens in a Safari tab instead of standalone.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#c44d18",
  width: "device-width",
  initialScale: 1,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
