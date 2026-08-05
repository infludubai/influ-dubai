import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieConsent } from "@/components/CookieConsent";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  organizationJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Influencer marketing for UAE & MENA`,
    // Pages that set their own title get it appended with the brand.
    template: `%s`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "influencer marketing UAE",
    "Dubai influencers",
    "MENA creators",
    "creator marketplace",
    "influencer platform Dubai",
    "UGC creators UAE",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Influencer marketing for UAE & MENA`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Influencer marketing for UAE & MENA`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0a1e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Static, developer-authored JSON — no user input reaches this.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        {/* Lets keyboard and screen-reader users jump past the nav. */}
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
