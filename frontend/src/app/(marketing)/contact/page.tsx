import { Mail, MapPin, MessageSquare, Clock } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { ContactForm } from "@/components/marketing/ContactForm";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Contact",
  path: "/contact",
  description:
    "Talk to the InfluDubai AI team about campaigns, partnerships, enterprise plans or creator verification.",
});

export default async function ContactPage() {
  const c = await getSiteContent();

  const CHANNELS = [
    {
      icon: Mail,
      title: "Email",
      value: c["global.supportEmail"],
      href: `mailto:${c["global.supportEmail"]}`,
    },
    {
      icon: MessageSquare,
      title: "Sales & enterprise",
      value: c["global.salesEmail"],
      href: `mailto:${c["global.salesEmail"]}`,
    },
    { icon: MapPin, title: "Office", value: c["global.address"] },
    { icon: Clock, title: "Response time", value: c["contact.responseTime"] },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={c["contact.title"] ?? "Get in touch"}
        subtitle={c["contact.subtitle"]}
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
          <div className="space-y-3">
            {CHANNELS.map((c) => {
              const content = (
                <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40">
                  <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {c.title}
                    </p>
                    <p className="truncate text-sm font-medium">{c.value}</p>
                  </div>
                </div>
              );
              return c.href ? (
                <a key={c.title} href={c.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={c.title}>{content}</div>
              );
            })}
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
