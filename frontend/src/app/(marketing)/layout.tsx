import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getSiteContent } from "@/lib/content";

/**
 * Route group: shares the public header/footer across every marketing page
 * without adding a path segment to their URLs.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched here (a server component) so the client header gets the admin's
  // brand name and logo without making a request of its own.
  const content = await getSiteContent();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        brandName={content["global.brandName"]}
        logoUrl={content["global.logoUrl"] || undefined}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
