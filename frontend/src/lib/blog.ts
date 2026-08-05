/**
 * Blog content lives in code for now — no CMS, no database table, no build
 * step. Adding a post means adding an entry here, and the index, RSS-ready
 * metadata and per-post pages all follow automatically.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string; // ISO date
  readingMinutes: number;
  author: { name: string; role: string };
  /** Simple block format — enough structure without pulling in MDX. */
  body: (
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "quote"; text: string }
  )[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "spotting-fake-followers-uae",
    title: "How to spot a bought audience before you spend a dirham",
    excerpt:
      "Follower count is the easiest metric to fake and the one most briefs still lead with. Here are the signals that actually separate a real audience from a purchased one.",
    category: "Fraud & trust",
    publishedAt: "2026-07-28",
    readingMinutes: 6,
    author: { name: "InfluDubai Research", role: "Platform team" },
    body: [
      {
        type: "p",
        text: "Buying followers is cheap, fast and largely invisible on a profile page. Buying genuine engagement is neither. That gap is where every reliable authenticity signal comes from.",
      },
      { type: "h2", text: "1. Engagement rate against audience size" },
      {
        type: "p",
        text: "Engagement rate falls predictably as an account grows — a 10K account routinely sees 4–8%, while a 500K account sitting above 5% is unusual enough to warrant a look. The red flag is not a low rate. It is a rate that does not move as the account scales.",
      },
      { type: "h2", text: "2. The shape of the growth curve" },
      {
        type: "p",
        text: "Organic growth is lumpy. A post lands, a collaboration hits, growth spikes then settles. Purchased growth looks like a staircase: flat, then a vertical jump of several thousand in under 48 hours, then flat again with no corresponding engagement lift.",
      },
      { type: "h2", text: "3. Comment quality, not comment count" },
      {
        type: "p",
        text: "Bot comments are short, generic and emoji-heavy. Scroll a creator's last five posts. If the comments could be pasted onto any post by any creator in any country, they probably were.",
      },
      { type: "h2", text: "4. Audience geography versus claimed market" },
      {
        type: "p",
        text: "A creator selling you a UAE audience whose followers skew heavily to markets with no relationship to their content is the single most expensive mistake in regional influencer marketing. Ask for the audience-country breakdown from platform insights, not a screenshot of the follower count.",
      },
      { type: "h2", text: "What to actually ask for" },
      {
        type: "ul",
        items: [
          "A screen recording of platform insights, not a still screenshot — stills are trivially edited",
          "Audience country and age breakdown for the last 30 days",
          "Reach and saves on the last five posts, not just likes",
          "Story completion rate if stories are part of the deliverable",
        ],
      },
      {
        type: "quote",
        text: "The cheapest fraud check is the one you run before the contract, not the reconciliation you run after the campaign.",
      },
      {
        type: "p",
        text: "On InfluDubai AI these checks run automatically. Every creator profile carries a risk score derived from engagement anomalies and growth patterns, and verified creators have had their platform insights reviewed by a human before the badge was granted.",
      },
    ],
  },
  {
    slug: "influencer-rates-uae-2026",
    title: "What UAE creators actually charge in 2026",
    excerpt:
      "Rate cards vary wildly and almost nobody publishes them. Here's how pricing tends to break down by tier, format and exclusivity in the UAE market.",
    category: "Pricing",
    publishedAt: "2026-07-14",
    readingMinutes: 7,
    author: { name: "InfluDubai Research", role: "Platform team" },
    body: [
      {
        type: "p",
        text: "The most common question from brands new to the region is the least commonly answered one: what is a fair rate? Here is how pricing generally behaves in the UAE, and what moves it.",
      },
      { type: "h2", text: "Tiers move the base, format moves the multiplier" },
      {
        type: "p",
        text: "Audience size sets a rough floor, but format does more work than most brands expect. A static feed post and a produced reel from the same creator can differ by three times, because one is an hour of work and the other is a shoot, an edit and a hook rewrite.",
      },
      { type: "h2", text: "What pushes a rate up" },
      {
        type: "ul",
        items: [
          "Exclusivity windows — a 30-day category lock-out is real lost income",
          "Usage rights — paid amplification and website use are separate line items, not freebies",
          "Turnaround — a three-day deadline prices differently from a three-week one",
          "Arabic and English versions of the same asset are two deliverables",
          "On-location shoots, especially anything requiring a permit",
        ],
      },
      { type: "h2", text: "What pushes a rate down" },
      {
        type: "ul",
        items: [
          "Multi-post packages booked together rather than one at a time",
          "Long-term ambassadorships with predictable monthly volume",
          "Creative freedom — heavy scripting costs the creator authenticity and time",
          "Product-only arrangements, which work for some categories and insult others",
        ],
      },
      { type: "h2", text: "Negotiate the brief, not the number" },
      {
        type: "p",
        text: "When a rate comes back higher than budget, the productive move is almost never to counter on price. It is to reduce the scope: shorten the exclusivity window, drop the paid usage rights, or move from a reel to a story set. Creators can nearly always meet a budget if the work shrinks with it.",
      },
      {
        type: "quote",
        text: "A rate is a function of scope. Change the scope and the rate follows — argue the number alone and you just lose the creator.",
      },
      {
        type: "p",
        text: "Every creator profile on InfluDubai AI carries a published rate range, and every deliverable has an agreed rate confirmed before work starts — so pricing is a conversation held once, in writing.",
      },
    ],
  },
  {
    slug: "campaign-brief-template",
    title: "The influencer brief template that stops revision spirals",
    excerpt:
      "Most revision rounds trace back to something the brief never said. These eight fields eliminate almost all of them.",
    category: "Campaign management",
    publishedAt: "2026-06-30",
    readingMinutes: 5,
    author: { name: "InfluDubai Research", role: "Platform team" },
    body: [
      {
        type: "p",
        text: "When a deliverable comes back wrong, the instinct is to blame execution. In practice, the vast majority of revision rounds trace to an expectation the brief held implicitly and never stated.",
      },
      { type: "h2", text: "The eight fields that matter" },
      {
        type: "ul",
        items: [
          "Objective — awareness, engagement, leads or sales. One, not four.",
          "The single message — if the audience remembers one sentence, what is it?",
          "Format and count — '1× reel, 60–90s, plus 3 stories with link sticker'",
          "Non-negotiables — legal lines, disclosure wording, pricing claims",
          "Explicit don'ts — competitors, phrases, settings, anything off-limits",
          "Deadline and posting window, including time of day if it matters",
          "Usage rights — organic only, or paid amplification and for how long",
          "Approval process — who reviews, how many rounds, turnaround time",
        ],
      },
      { type: "h2", text: "The two fields brands forget" },
      {
        type: "p",
        text: "Usage rights and approval process. Omit usage rights and you will end up in an awkward conversation about boosting a post you assumed you owned. Omit the approval process and every revision becomes an open-ended negotiation.",
      },
      { type: "h2", text: "Say what good looks like" },
      {
        type: "p",
        text: "Link two or three examples of content you would be happy to receive — ideally from the same creator's own feed. Reference beats adjectives. 'Premium but warm' means nothing; a link means everything.",
      },
      {
        type: "quote",
        text: "Every hour spent sharpening a brief saves roughly a day of revisions later, and considerably more goodwill.",
      },
      {
        type: "p",
        text: "The campaign brief on InfluDubai AI captures these fields structurally, and each deliverable carries its own brief, deadline and agreed rate — so what was asked for stays visible to both sides throughout.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function sortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
