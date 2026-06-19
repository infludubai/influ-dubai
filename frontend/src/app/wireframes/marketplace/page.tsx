import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { WireframeBlock } from "@/components/wireframe-block";

const filterGroups = [
  { label: "Country", options: ["UAE", "Saudi Arabia", "Egypt", "Qatar"] },
  { label: "City", options: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { label: "Category", options: ["Beauty", "Fashion", "Fitness", "Tech", "Food"] },
  { label: "Platform", options: ["Instagram", "TikTok", "YouTube", "LinkedIn", "X"] },
];

const rangeFilters = ["Followers", "Engagement Rate", "Budget Range"];

export default function MarketplaceWireframe() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Creator Marketplace</h1>
        <div className="flex w-full max-w-md gap-2">
          <Input placeholder="Search by name, category, handle…" />
          <Button>Search</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-5 rounded-lg border p-4">
          <div className="text-sm font-semibold">Filters</div>
          {filterGroups.map((g) => (
            <div key={g.label} className="space-y-2">
              <div className="text-sm font-medium">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map((o) => (
                  <Badge key={o} variant="outline" className="cursor-pointer px-2 py-1">
                    {o}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {rangeFilters.map((r) => (
            <div key={r} className="space-y-2">
              <div className="text-sm font-medium">{r}</div>
              <WireframeBlock label="Range slider" height="h-8" />
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium">Language</div>
            <WireframeBlock label="Select: English / Arabic" height="h-8" />
          </div>
          <Button variant="outline" className="w-full">Clear filters</Button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>1,248 creators found</span>
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <WireframeBlock label="Relevance ▾" height="h-8" className="w-32" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 pt-6">
                  <WireframeBlock label="Avatar / cover" height="h-28" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Creator Name {i + 1}</div>
                    <Badge variant="secondary">Beauty</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Dubai, UAE · Instagram + TikTok</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>120K followers</span>
                    <span>4.8% ER</span>
                  </div>
                  <div className="text-xs text-muted-foreground">From AED 1,500 / post</div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1">View Profile</Button>
                    <Button size="sm" className="flex-1">Invite</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2 text-sm text-muted-foreground">
            <span>« Prev</span>
            <span className="font-medium text-foreground">1</span>
            <span>2</span>
            <span>3</span>
            <span>… 42</span>
            <span>Next »</span>
          </div>
        </div>
      </div>
    </div>
  );
}
