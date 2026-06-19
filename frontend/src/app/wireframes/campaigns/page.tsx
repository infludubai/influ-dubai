import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WireframeBlock } from "@/components/wireframe-block";

const creatorRows = [
  { name: "Creator A", status: "Accepted", deliverable: "2 Reels + 1 Story" },
  { name: "Creator B", status: "Applied", deliverable: "1 TikTok video" },
  { name: "Creator C", status: "Invited", deliverable: "3 Posts" },
  { name: "Creator D", status: "Declined", deliverable: "—" },
];

const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  Accepted: "default",
  Applied: "secondary",
  Invited: "outline",
  Declined: "destructive",
};

export default function CampaignManagementWireframe() {
  return (
    <div className="px-6 py-6">
      {/* Campaign header */}
      <div className="mb-6 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">Ramadan Collection Launch</h1>
            <Badge>Live</Badge>
            <Badge variant="outline">Awareness</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Mar 1 – Mar 30 · Budget AED 25,000 · 8 creators invited
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Pause</Button>
          <Button>+ Invite Creator</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="creators">Creators &amp; Offers</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Campaign brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Promote the new Ramadan collection to UAE-based audiences via
                  authentic creator content. Focus on lifestyle &amp; fashion
                  creators with engaged local followings.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div><span className="font-medium text-foreground">Target audience:</span> Women 18–35, UAE</div>
                  <div><span className="font-medium text-foreground">Platforms:</span> Instagram, TikTok</div>
                  <div><span className="font-medium text-foreground">Categories:</span> Fashion, Lifestyle</div>
                  <div><span className="font-medium text-foreground">Languages:</span> English, Arabic</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline &amp; budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Timeline progress</span>
                    <span>Day 12 / 30</span>
                  </div>
                  <Progress value={40} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Budget spent</span>
                    <span>AED 9,800 / 25,000</span>
                  </div>
                  <Progress value={39} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Creators & Offers */}
        <TabsContent value="creators" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invited &amp; applied creators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {creatorRows.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.deliverable}</div>
                    </div>
                  </div>
                  <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables */}
        <TabsContent value="deliverables" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submitted content</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <WireframeBlock key={i} label="Content preview + approve/reject" height="h-32" />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="mt-4">
          <WireframeBlock label="Campaign group / 1:1 message thread" height="h-64" />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            ["318K", "Reach"],
            ["22K", "Engagement"],
            ["4.1K", "Clicks"],
            ["3.2x", "ROI Estimate"],
          ].map(([n, l]) => (
            <Card key={l}>
              <CardContent className="pt-6">
                <div className="text-xl font-bold">{n}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
