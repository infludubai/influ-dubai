import { Mail, MapPin, MessageSquare, Clock } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { ContactForm } from "@/components/marketing/ContactForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  path: "/contact",
  description:
    "Talk to the InfluDubai AI team about campaigns, partnerships, enterprise plans or creator verification.",
});

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@infludubai.com",
    href: "mailto:hello@infludubai.com",
  },
  {
    icon: MessageSquare,
    title: "Sales & enterprise",
    value: "sales@infludubai.com",
    href: "mailto:sales@infludubai.com",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Dubai, United Arab Emirates",
  },
  {
    icon: Clock,
    title: "Response time",
    value: "Within one business day",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Questions about campaigns, enterprise plans, verification or partnerships — we read everything that comes in."
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
