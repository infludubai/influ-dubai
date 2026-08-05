import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";

/**
 * Shared building blocks for the marketing pages, so the three segment
 * landers stay visually identical without triplicating layout code.
 */

export function SegmentHero({
  eyebrow,
  title,
  subtitle,
  primary,
  secondary,
  accent = "#7c3aed",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  accent?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Soft accent wash — kept behind content and non-interactive. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, ${accent} 0%, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-24">
        <p
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {eyebrow}
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={primary.href}>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
              style={{ background: accent }}
            >
              {primary.label} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          {secondary && (
            <Link href={secondary.href}>
              <button className="rounded-xl border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted">
                {secondary.label}
              </button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function StatBand({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeatureGrid({
  title,
  subtitle,
  features,
  accent = "#7c3aed",
}: {
  title: string;
  subtitle?: string;
  features: { icon: ElementType; title: string; body: string }[];
  accent?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${accent}1a`, color: accent }}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CheckList({
  title,
  items,
  accent = "#7c3aed",
}: {
  title: string;
  items: string[];
  accent?: string;
}) {
  return (
    <div>
      <h3 className="mb-4 font-bold">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${accent}1a`, color: accent }}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Quote({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <figure className="rounded-2xl border bg-card p-6">
      <blockquote className="text-[15px] leading-relaxed text-muted-foreground">
        “{quote}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export function CTASection({
  title,
  subtitle,
  primary,
  secondary,
  accent = "#7c3aed",
}: {
  title: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  accent?: string;
}) {
  return (
    <section className="border-t bg-muted/20">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href={primary.href}>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
              style={{ background: accent }}
            >
              {primary.label} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          {secondary && (
            <Link href={secondary.href}>
              <button className="rounded-xl border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted">
                {secondary.label}
              </button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
