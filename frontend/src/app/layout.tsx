import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfluDubai AI",
  description: "Creator intelligence & influencer marketing platform for UAE/MENA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
