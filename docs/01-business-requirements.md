# Business Requirements — Phase 1

Status: Draft for review
Scope: InfluDubai AI MVP (Phases 1–14, per project roadmap)

## 1. User Types

| Role | Description | Primary Goals |
|---|---|---|
| **Creator** | Influencer/content creator (Instagram, TikTok, YouTube, LinkedIn, X) | Get discovered, receive fair offers, manage deliverables, get paid, track performance |
| **Brand** | Business running influencer campaigns | Discover vetted creators, launch & manage campaigns, measure ROI |
| **Agency** | Manages campaigns on behalf of multiple brand clients | Same as Brand, plus multi-client/team workspace separation |
| **Admin** | Platform operator | Moderate users/content, monitor fraud, manage billing, view platform-wide analytics |
| *(Future)* Government | Public-sector campaigns / creator economy oversight | Same as Brand + compliance reporting (Phase 2 expansion) |

Each user belongs to exactly one primary role at signup; Agencies can manage multiple Brand sub-accounts (team/client structure handled in Phase 4).

## 2. User Journeys

### 2.1 Creator Journey
1. Sign up → verify email → select role "Creator"
2. Onboarding wizard: bio, location, languages, categories, rate card
3. Link social accounts (OAuth where available; manual handle entry as fallback)
4. Profile goes to **verification queue** (manual or automated check of follower authenticity)
5. Once verified, profile becomes discoverable in Marketplace
6. Creator receives campaign invitations or applies to open campaigns
7. Negotiates/accepts offer → submits deliverables → brand approves → payment released
8. Tracks earnings, performance, and AI-generated profile insights over time

### 2.2 Brand Journey
1. Sign up → verify email → select role "Brand" (or "Agency")
2. Company onboarding: industry, target markets, budget range
3. Create campaign via wizard (objective, audience, budget, timeline, deliverables)
4. Search/filter Marketplace **or** accept Matching Engine recommendations
5. Send invitations / review applications → negotiate offers
6. Manage accepted creators through Campaign Collaboration workflow
7. Review submitted deliverables → approve/request changes
8. View Analytics Dashboard for campaign performance and ROI
9. Subscribe to a paid plan once usage exceeds free-tier limits

### 2.3 Agency Journey
Same as Brand, with an added layer: Agency creates/manages multiple Brand workspaces (clients), with role-scoped access per team member (Phase 4+ feature, not MVP-blocking for Phase 1).

### 2.4 Admin Journey
1. Log into Admin Control Center
2. Review flagged users/content (moderation queue)
3. Review fraud/risk scores on creators
4. Monitor platform-wide revenue, campaign volume, system health
5. Manage subscription plans and billing disputes

## 3. Marketplace Workflows

- **Discovery**: Brands search/filter creators by Country, City, Category, Followers, Engagement Rate, Language, Budget Range, Platform.
- **Profile inspection**: View public profile, media kit, portfolio, rate card, verification badge, trust score (post Phase 10).
- **Engagement initiation**: Brand-initiated invite, or Creator-initiated application to an open campaign listing.
- **Offer negotiation**: Structured offer object (deliverables, rate, deadline) exchanged via in-platform messaging — not freeform until terms are accepted, to keep an auditable trail.
- **Acceptance & collaboration**: Once accepted, a Campaign Collaboration record is created, tracked through defined statuses (see Architecture doc, Campaign workflow states).
- **Completion**: Deliverable approval triggers payment release (manual in MVP; automated in later phase via Stripe).

## 4. AI Workflows (introduced progressively — see Phases 9–11)

| Workflow | Phase | Output |
|---|---|---|
| Creator Profile Analysis | 9 | Structured summary of niche, tone, content style |
| Audience Summary | 9 | Demographic/interest breakdown of follower base |
| Creator Quality Score | 9 | Composite score combining engagement quality + consistency |
| AI Recommendations | 9 | Ranked creator suggestions for a given campaign brief |
| Engagement Anomaly / Fraud Detection | 10 | Risk score (Low/Medium/High) + flags |
| Campaign Outcome Prediction | 11 | Predicted reach, engagement, conversion, ROI before launch |

All AI workflows are additive layers on top of the rule-based Matching Engine (Phase 6) — the platform must function correctly with AI features disabled/unavailable.

## 5. Revenue Model

1. **Subscription tiers** (Phase 12): Free, Professional, Enterprise — gated by number of active campaigns, creator searches/month, analytics depth, and team seats.
2. **Take-rate on transactions** *(recommended addition — confirm with stakeholders)*: a platform fee on creator payouts processed through InfluDubai AI, similar to standard marketplace economics.
3. **Enterprise/Agency contracts**: custom pricing for high-volume agencies and government accounts (Phase 2 expansion).
4. **Future**: White-label licensing, Enterprise API access (Phase 2 expansion).

> Open question for stakeholder sign-off: confirm whether a transaction take-rate applies in addition to subscriptions, and the target percentage — this affects the Billing schema in the Architecture doc.

## 6. Out of Scope for MVP

- Mobile applications
- Government portal
- White-label solution
- Cross-border MENA expansion beyond UAE-first launch
- AI Campaign Predictor, AI Fraud Detection, AI Brand Safety (all Phase 2 expansion per roadmap, though Phases 9–10 are included in this MVP plan — confirm final cut line before Phase 9 kickoff)

## 7. Approval

- [ ] Business Requirements reviewed
- [ ] Open questions (Section 5) resolved
- [ ] Approved to proceed to wireframe sign-off and Phase 2
