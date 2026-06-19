import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { WireframeBlock } from "@/components/wireframe-block";

const navItems = [
  "Overview",
  "My Profile",
  "Media Kit",
  "Campaigns & Offers",
  "Messages",
  "Analytics",
  "Earnings",
  "Settings",
];

const stats = [
  ["48.2K", "Followers"],
  ["5.8%", "Engagement Rate"],
  ["3", "Active Campaigns"],
  ["AED 6,400", "Earnings (this month)"],
];

const invites = [
  { brand: "Brand A", campaign: "Ramadan Collection Launch", budget: "AED 3,000", status: "Pending" },
  { brand: "Brand B", campaign: "Summer Fitness Push", budget: "AED 1,800", status: "Pending" },
  { brand: "Brand C", campaign: "App Install Drive", budget: "AED 2,200", status: "Accepted" },
];

export default function CreatorDashboardWireframe() {
  return (
    <DashboardShell role="Creator" navItems={navItems} activeItem="Overview">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome back, Creator 👋</h1>
        <Button size="sm">Complete profile</Button>
      </div>

      {/* Profile completion */}
      <Card className="mb-6">
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile completion</span>
            <span className="text-muted-foreground">70%</span>
          </div>
          <Progress value={70} />
          <p className="text-xs text-muted-foreground">
            Add your media kit and link TikTok to reach 100%.
          </p>
        </CardContent>
      </Card>

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
        {/* Campaign invitations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Campaign invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.campaign}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{inv.campaign}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.brand} · {inv.budget}
                  </div>
                </div>
                <Badge variant={inv.status === "Accepted" ? "default" : "outline"}>
                  {inv.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Messages preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Brand A", "Brand C", "InfluDubai Support"].map((m) => (
              <div key={m} className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="font-medium">{m}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    Latest message preview text…
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Performance (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <WireframeBlock label="Reach / Engagement chart" height="h-48" />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
