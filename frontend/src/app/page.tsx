import { HomeClient } from "@/components/home/HomeClient";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "InfluDubai AI — Influencer marketing for UAE & MENA",
  path: "/",
});

// Copy is admin-editable, so the homepage must not be frozen at build time.
export const dynamic = "force-dynamic";

/**
 * Server wrapper: fetches the admin-managed copy and hands it to the
 * animated client homepage, then renders the shared footer.
 */
export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <>
      <HomeClient content={content} />
      <SiteFooter />
    </>
  );
}
