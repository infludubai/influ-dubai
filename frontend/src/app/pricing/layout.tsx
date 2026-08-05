import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pricing",
  path: "/pricing",
  description:
    "Free to start. Paid plans add more active campaigns, creator engagements, analytics depth and team seats. No markup on creator rates.",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
