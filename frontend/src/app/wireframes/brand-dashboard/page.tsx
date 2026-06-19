import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WireframeBlock } from "@/components/wireframe-block";

const navItems = [
  "Overview",
  "Campaigns",
  "Discover Creators",
  "Messages",
  "Analytics",
  "Billing",
  "Team",
  "Settings",
];

const stats = [
  ["5", "Active Campaigns"],
  ["1.2M", "Total Reach"],
  ["AED 84,000", "Total Spend"],
  ["4.6%", "Avg. Engagement"],
];

const campaigns = [
  { name: "Ramadan Collection Launch", type: "Awareness", status: "Live", creators: 8 },
  { name: "Summer Fitness Push", type: "Engagement", status: "Live", creators: 5 },
  { name: "App Install Drive", type: "Lead Generation", status: "Draft", creators: 0 },
  { name: "Q2 Sales Boost", type: "Sales", status: "Completed", creators: 12 },
];

const statusVariant: Record<string, "default" | "outline" | "secondary"> = {
  Live: "default",
  Draft: "outline",
  Completed: "secondary",
};

export default function BrandDashboardWireframe() {
  return (
    <DashboardShell role="Brand" navItems={navItems} activeItem="Overview">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Brand Dashboard</h1>
        <Button size="sm">+ New Campaign</Button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {stats.map(([n, l]) => (
          <Card key={l}>
            <CardContent className="pt-6">
              <div className="text-xl font-bold">{n}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Your campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.type} · {c.creators} creators
                  </div>
                </div>
                <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>✅ Creator X accepted your offer</div>
            <div>💬 New message from Creator Y</div>
            <div>📊 Weekly report ready for Q2 Sales Boost</div>
            <div>🆕 3 new creators match &quot;Fitness Push&quot;</div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended creators (matching engine preview) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recommended creators</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <WireframeBlock label="Avatar" height="h-20" />
              <div className="text-sm font-medium">Creator Name</div>
              <div className="text-xs text-muted-foreground">98% match · Fitness · Dubai</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
