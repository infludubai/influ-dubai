import { Suspense } from "react";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
