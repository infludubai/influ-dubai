"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/wireframes", label: "Phase 1 Index" },
  { href: "/wireframes/homepage", label: "Homepage" },
  { href: "/wireframes/creator-dashboard", label: "Creator Dashboard" },
  { href: "/wireframes/brand-dashboard", label: "Brand Dashboard" },
  { href: "/wireframes/marketplace", label: "Marketplace" },
  { href: "/wireframes/campaigns", label: "Campaign Management" },
];

export function WireframeNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Phase 1 · Wireframe Preview
        </span>
        <nav className="flex flex-wrap gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                pathname === link.href
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
