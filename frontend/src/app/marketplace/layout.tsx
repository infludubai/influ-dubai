import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";

// The page itself is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Creator marketplace",
  path: "/marketplace",
  description:
    "Search verified UAE and MENA creators by niche, city, audience size, engagement rate, language and budget. Free to browse.",
});

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
