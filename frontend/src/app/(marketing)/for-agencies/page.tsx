import {
  Building2, Users, LayoutGrid, ShieldCheck, FileBarChart, KeyRound,
} from "lucide-react";
import {
  SegmentHero, StatBand, FeatureGrid, CheckList, Quote, CTASection,
} from "@/components/marketing/Sections";
import { pageMetadata } from "@/lib/seo";

const ACCENT = "#2563eb";

export const metadata = pageMetadata({
  title: "For agencies",
  path: "/for-agencies",
  description:
    "Run every client from one login. Separate workspaces per client, scoped team roles, and consolidated reporting for UAE and MENA influencer programmes.",
});

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "One workspace per client",
    body: "Each client gets its own campaigns, creators, budget and shortlists. Switch between them from the sidebar — no logging out, no second account.",
  },
  {
    icon: ShieldCheck,
    title: "Data stays separated",
    body: "Workspace scoping is enforced at the query layer, not hidden in the UI. One client's campaigns are never visible from another's workspace.",
  },
  {
    icon: Users,
    title: "Team seats with real roles",
    body: "Invite account managers as Admin, Member or Viewer. Juniors can draft and manage; only admins can invite others or touch billing.",
  },
  {
    icon: KeyRound,
    title: "Invitations that just work",
    body: "Invite by email. Existing users get access immediately; new ones are dropped straight into the right workspace when they sign up.",
  },
  {
    icon: FileBarChart,
    title: "Reporting per client",
    body: "Campaign analytics, spend and creator performance scoped to whichever client you're viewing — ready to drop into a monthly report.",
  },
  {
    icon: Building2,
    title: "Enterprise terms",
    body: "Unlimited seats and campaigns, custom commercial terms, and a named contact for onboarding your whole roster.",
  },
];

export default function ForAgenciesPage() {
  return (
    <>
      <SegmentHero
        accent={ACCENT}
        eyebrow="For agencies"
        title={
          <>
            Every client, every campaign,
            <br className="hidden sm:block" /> one login
          </>
        }
        subtitle="Stop running a separate spreadsheet, inbox and reporting deck per client. Give each one its own workspace, give your team scoped access, and switch between them in a click."
        primary={{ label: "Start as an agency", href: "/register?role=AGENCY" }}
        secondary={{ label: "Talk to sales", href: "/contact" }}
      />

      <StatBand
        stats={[
          { value: "Unlimited", label: "client workspaces" },
          { value: "4", label: "team role levels" },
          { value: "1", label: "login for everything" },
          { value: "Frankfurt", label: "EU data region" },
        ]}
      />

      <FeatureGrid
        accent={ACCENT}
        title="Built for managing a roster"
        subtitle="The multi-client problem is the whole problem. This is designed around it rather than bolted on."
        features={FEATURES}
      />

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <CheckList
              accent={ACCENT}
              title="Role permissions at a glance"
              items={[
                "Owner — full control, including billing and workspace deletion",
                "Admin — manage campaigns, deliverables and team members",
                "Member — manage campaigns and approve deliverables",
                "Viewer — read-only, ideal for clients you want to give visibility",
                "Seats are pooled across your plan, not per workspace",
                "Removing someone revokes access immediately, everywhere",
              ]}
            />
            <CheckList
              accent={ACCENT}
              title="Typical agency setup"
              items={[
                "Create one workspace per client brand",
                "Invite the account lead as Admin on their clients",
                "Add junior staff as Members to draft and track work",
                "Give the client a Viewer seat for transparent reporting",
                "Shortlists are shared, so research isn't repeated",
                "Switch workspace to change every view at once",
              ]}
            />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Quote
              quote="Four hotel clients used to mean four spreadsheets and four inboxes. Now it's one review queue and a workspace switcher."
              name="Account Director"
              role="Dubai creative agency"
            />
            <Quote
              quote="Giving clients a viewer seat killed the weekly status email. They just look."
              name="Managing Partner"
              role="MENA media agency"
            />
          </div>
        </div>
      </section>

      <CTASection
        accent={ACCENT}
        title="Bring your whole roster over"
        subtitle="Start with one client workspace and add the rest as you go. We'll help with onboarding at any scale."
        primary={{ label: "Create an agency account", href: "/register?role=AGENCY" }}
        secondary={{ label: "Contact sales", href: "/contact" }}
      />
    </>
  );
}
