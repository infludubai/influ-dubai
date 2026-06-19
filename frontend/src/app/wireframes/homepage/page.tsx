import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WireframeBlock } from "@/components/wireframe-block";

const categories = ["Beauty", "Fashion", "Fitness", "Food", "Tech", "Travel", "Family", "Finance"];
const steps = [
  { n: "1", t: "Create your profile", d: "Add bio, rates, categories & link socials." },
  { n: "2", t: "Get discovered", d: "Brands find you via search & AI matching." },
  { n: "3", t: "Collaborate & earn", d: "Accept offers, deliver content, get paid." },
];

export default function HomepageWireframe() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="text-lg font-bold">[Logo] InfluDubai AI</div>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <span>For Creators</span>
          <span>For Brands</span>
          <span>Marketplace</span>
          <span>Pricing</span>
        </nav>
        <div className="flex items-center gap-2">
          <Badge variant="outline">EN / AR</Badge>
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Sign up</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <Badge variant="secondary">UAE &amp; MENA Creator Intelligence Platform</Badge>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
          Find the right creators. Launch campaigns that perform.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          AI-powered discovery, vetting and analytics for brands, agencies and
          creators across the UAE and MENA region.
        </p>
        <div className="flex w-full max-w-lg gap-2">
          <Input placeholder="Search creators by category, city, or platform…" />
          <Button>Search</Button>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">I&apos;m a Brand</Button>
          <Button variant="outline">I&apos;m a Creator</Button>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-4 border-y bg-muted/30 px-6 py-6 sm:grid-cols-4">
        {[
          ["12,000+", "Verified Creators"],
          ["850+", "Active Brands"],
          ["3,200+", "Campaigns Run"],
          ["AED 40M+", "Creator Earnings"],
        ].map(([n, l]) => (
          <div key={l} className="text-center">
            <div className="text-xl font-bold">{n}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="px-6 py-12">
        <h2 className="mb-4 text-lg font-semibold">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c} variant="outline" className="px-3 py-1.5">{c}</Badge>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 px-6 py-12">
        <h2 className="mb-6 text-lg font-semibold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n}>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm font-bold text-muted-foreground">Step {s.n}</div>
                <div className="font-medium">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured creators */}
      <section className="px-6 py-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured creators</h2>
          <span className="text-sm text-muted-foreground">View marketplace →</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 pt-6">
                <WireframeBlock label="Avatar" height="h-20" />
                <div className="text-sm font-medium">Creator Name</div>
                <div className="text-xs text-muted-foreground">Category · Dubai</div>
                <div className="text-xs text-muted-foreground">240K followers · 5.2% ER</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="px-6 py-12">
        <h2 className="mb-4 text-lg font-semibold">What our users say</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <WireframeBlock label="Testimonial card" />
          <WireframeBlock label="Testimonial card" />
          <WireframeBlock label="Testimonial card" />
        </div>
      </section>

      {/* CTA banner */}
      <section className="flex flex-col items-center gap-4 bg-foreground px-6 py-14 text-center text-background">
        <h2 className="text-2xl font-semibold">Ready to grow with InfluDubai AI?</h2>
        <div className="flex gap-3">
          <Button variant="secondary">Get started free</Button>
          <Button variant="outline" className="border-background text-background hover:bg-background/10">
            Talk to sales
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="grid gap-6 border-t px-6 py-10 text-sm text-muted-foreground sm:grid-cols-4">
        <div>
          <div className="mb-2 font-semibold text-foreground">InfluDubai AI</div>
          <p>Creator intelligence for the UAE &amp; MENA.</p>
        </div>
        {["Platform", "Company", "Legal"].map((col) => (
          <div key={col} className="space-y-1">
            <div className="font-medium text-foreground">{col}</div>
            <div>Link</div>
            <div>Link</div>
            <div>Link</div>
          </div>
        ))}
      </footer>
    </div>
  );
}
