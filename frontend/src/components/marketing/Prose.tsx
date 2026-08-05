import type { ReactNode } from "react";

/** Standard hero for an inner marketing page. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Readable long-form container. Legal and editorial pages use this so line
 * length stays comfortable rather than stretching across a wide viewport.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="space-y-6 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}

export function LastUpdated({ date }: { date: string }) {
  return (
    <p className="text-xs uppercase tracking-wider text-muted-foreground">
      Last updated {date}
    </p>
  );
}
