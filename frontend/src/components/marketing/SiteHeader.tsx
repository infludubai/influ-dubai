"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route changes should never leave the mobile menu stuck open.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-border bg-background/85 backdrop-blur-md"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            InfluDubai <span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard">
              <button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90">
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <button className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Log in
                </button>
              </Link>
              <Link href="/register">
                <button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90">
                  Get started
                </button>
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-background px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="block rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
