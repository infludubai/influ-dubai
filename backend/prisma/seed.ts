import { PrismaClient, RoleName, SocialPlatform, VerificationStatus, CampaignType, CampaignStatus, InvitationStatus, ProposalStatus, PlanTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SEED_PASSWORD = 'Demo1234!';
const hash = (pw: string) => bcrypt.hash(pw, 10);

async function main() {
  console.log('🌱 Seeding InfluDubai AI demo data…\n');

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roleMap: Record<string, string> = {};
  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({ where: { name }, create: { name, description: `${name} role` }, update: {} });
    roleMap[name] = role.id;
  }
  console.log('✓ Roles ensured');

  // ── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@infludubai.com' },
    create: {
      email: 'admin@infludubai.com',
      passwordHash: await hash('Admin123!'),
      status: 'ACTIVE',
      roleId: roleMap.ADMIN,
      profile: { create: { displayName: 'Platform Admin', country: 'UAE', city: 'Dubai', languages: ['English', 'Arabic'] } },
    },
    update: {},
  });
  console.log('✓ Admin: admin@infludubai.com / Admin123!');

  // ── Creators ───────────────────────────────────────────────────────────────
  type CreatorDef = {
    email: string; displayName: string; bio: string; location: string;
    categories: string[]; languages: string[]; minRate: number; maxRate: number;
    socials: { platform: SocialPlatform; handle: string; followers: number; engagement: number }[];
    verification: VerificationStatus; fraudScore: number; fraudLevel: string; fraudFlags: string[]; audience: number;
  };

  const creators: CreatorDef[] = [
    {
      email: 'layla.hassan@demo.com', displayName: 'Layla Hassan',
      bio: 'Dubai-based lifestyle & fashion creator. Authentic storytelling meets Middle Eastern elegance.',
      location: 'Dubai, UAE', categories: ['Fashion', 'Lifestyle', 'Beauty'], languages: ['Arabic', 'English'],
      minRate: 800, maxRate: 3500, audience: 796000,
      socials: [
        { platform: SocialPlatform.INSTAGRAM, handle: 'laylahassan.ae',  followers: 284000, engagement: 4.8 },
        { platform: SocialPlatform.TIKTOK,    handle: 'laylahassan',     followers: 512000, engagement: 7.2 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 12, fraudLevel: 'LOW', fraudFlags: [],
    },
    {
      email: 'omar.khalid@demo.com', displayName: 'Omar Khalid',
      bio: 'Tech reviewer & gadget geek from Abu Dhabi. Covering smartphones, AI, and future tech across the Arab world.',
      location: 'Abu Dhabi, UAE', categories: ['Tech', 'Gaming', 'Education'], languages: ['Arabic', 'English'],
      minRate: 1200, maxRate: 5000, audience: 533000,
      socials: [
        { platform: SocialPlatform.YOUTUBE,   handle: 'OmarTechArab',  followers: 390000, engagement: 5.1 },
        { platform: SocialPlatform.INSTAGRAM, handle: 'omar.tech.ae',  followers: 98000,  engagement: 3.6 },
        { platform: SocialPlatform.X,         handle: 'omartechae',    followers: 45000,  engagement: 2.1 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 8, fraudLevel: 'LOW', fraudFlags: [],
    },
    {
      email: 'nour.al.rashid@demo.com', displayName: 'Nour Al Rashid',
      bio: 'Saudi food blogger & recipe creator. From traditional Gulf cuisine to modern fusions — bringing flavour to every feed.',
      location: 'Riyadh, Saudi Arabia', categories: ['Food', 'Lifestyle', 'Travel'], languages: ['Arabic', 'English'],
      minRate: 600, maxRate: 2500, audience: 406000,
      socials: [
        { platform: SocialPlatform.INSTAGRAM, handle: 'nour.cooks',   followers: 175000, engagement: 6.3 },
        { platform: SocialPlatform.TIKTOK,    handle: 'nouralrashid', followers: 231000, engagement: 9.1 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 15, fraudLevel: 'LOW', fraudFlags: [],
    },
    {
      email: 'ahmed.fitness@demo.com', displayName: 'Ahmed Al Mansoori',
      bio: 'Certified PT & wellness coach. Helping the MENA region build healthier habits — one rep at a time.',
      location: 'Dubai, UAE', categories: ['Fitness', 'Lifestyle', 'Health'], languages: ['Arabic', 'English'],
      minRate: 500, maxRate: 2000, audience: 210000,
      socials: [
        { platform: SocialPlatform.INSTAGRAM, handle: 'ahmedfitae',      followers: 142000, engagement: 5.9 },
        { platform: SocialPlatform.YOUTUBE,   handle: 'AhmedFitnessDXB', followers: 68000,  engagement: 4.4 },
      ],
      verification: VerificationStatus.PENDING, fraudScore: 21, fraudLevel: 'LOW', fraudFlags: [],
    },
    {
      email: 'sara.travels@demo.com', displayName: 'Sara Mahmoud',
      bio: 'Luxury travel curator. Exploring five-star experiences across the Arab world and beyond.',
      location: 'Dubai, UAE', categories: ['Travel', 'Lifestyle', 'Fashion'], languages: ['Arabic', 'English', 'French'],
      minRate: 2000, maxRate: 8000, audience: 1070000,
      socials: [
        { platform: SocialPlatform.INSTAGRAM, handle: 'saratravelsme', followers: 520000, engagement: 3.8 },
        { platform: SocialPlatform.YOUTUBE,   handle: 'SaraTravelsME', followers: 210000, engagement: 4.9 },
        { platform: SocialPlatform.TIKTOK,    handle: 'saratravels',   followers: 340000, engagement: 6.1 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 44, fraudLevel: 'MEDIUM', fraudFlags: ['low_comment_ratio'],
    },
    {
      email: 'khalid.gaming@demo.com', displayName: 'Khalid Al Amri',
      bio: 'Pro gamer & esports commentator from Oman. Gaming in Arabic — reviews, streams, and tournament coverage.',
      location: 'Muscat, Oman', categories: ['Gaming', 'Entertainment', 'Tech'], languages: ['Arabic', 'English'],
      minRate: 400, maxRate: 1800, audience: 475000,
      socials: [
        { platform: SocialPlatform.YOUTUBE, handle: 'KhalidGamingAR', followers: 295000, engagement: 6.8 },
        { platform: SocialPlatform.TIKTOK,  handle: 'khalidgames',    followers: 180000, engagement: 8.5 },
      ],
      verification: VerificationStatus.UNVERIFIED, fraudScore: 67, fraudLevel: 'HIGH', fraudFlags: ['engagement_anomaly', 'sudden_follower_spike'],
    },
    {
      email: 'dina.beauty@demo.com', displayName: 'Dina Karimi',
      bio: 'Cairo-based MUA & beauty educator. Celebrating Arab beauty through make-up artistry, skincare, and honest reviews.',
      location: 'Cairo, Egypt', categories: ['Beauty', 'Fashion', 'Lifestyle'], languages: ['Arabic', 'English'],
      minRate: 350, maxRate: 1500, audience: 665000,
      socials: [
        { platform: SocialPlatform.INSTAGRAM, handle: 'dinakarimi.beauty', followers: 210000, engagement: 7.6 },
        { platform: SocialPlatform.TIKTOK,    handle: 'dinabeautyme',      followers: 455000, engagement: 11.2 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 9, fraudLevel: 'LOW', fraudFlags: [],
    },
    {
      email: 'faisal.finance@demo.com', displayName: 'Faisal Al Dossary',
      bio: 'CFA-certified financial educator simplifying investing & wealth building for Arab millennials. Kuwait.',
      location: 'Kuwait City, Kuwait', categories: ['Finance', 'Business', 'Education'], languages: ['Arabic', 'English'],
      minRate: 1500, maxRate: 6000, audience: 305000,
      socials: [
        { platform: SocialPlatform.LINKEDIN, handle: 'faisalaldossary', followers: 87000,  engagement: 5.3 },
        { platform: SocialPlatform.YOUTUBE,  handle: 'FaisalFinanceKW', followers: 156000, engagement: 4.7 },
        { platform: SocialPlatform.X,        handle: 'faisalfinance',   followers: 62000,  engagement: 3.2 },
      ],
      verification: VerificationStatus.VERIFIED, fraudScore: 6, fraudLevel: 'LOW', fraudFlags: [],
    },
  ];

  const creatorProfileIds: string[] = [];
  for (const c of creators) {
    let existing = await prisma.user.findUnique({ where: { email: c.email }, include: { creatorProfile: true } });
    if (existing?.creatorProfile) { creatorProfileIds.push(existing.creatorProfile.id); continue; }
    const user = await prisma.user.create({
      data: {
        email: c.email, passwordHash: await hash(SEED_PASSWORD), status: 'ACTIVE', roleId: roleMap.CREATOR,
        profile: { create: { displayName: c.displayName, bio: c.bio, country: c.location.split(', ')[1] ?? 'UAE', city: c.location.split(', ')[0], languages: c.languages, categories: c.categories } },
        creatorProfile: {
          create: {
            bio: c.bio, location: c.location, languages: c.languages, categories: c.categories,
            minRateUsd: c.minRate, maxRateUsd: c.maxRate, totalAudienceSize: c.audience,
            verificationStatus: c.verification, fraudRiskScore: c.fraudScore, fraudRiskLevel: c.fraudLevel,
            fraudFlags: c.fraudFlags, fraudAnalyzedAt: new Date(),
            socialAccounts: { create: c.socials.map(s => ({ platform: s.platform, handle: s.handle, followersCount: s.followers, engagementRate: s.engagement })) },
          },
        },
      },
      include: { creatorProfile: true },
    });
    if (user.creatorProfile) creatorProfileIds.push(user.creatorProfile.id);
  }
  console.log(`✓ ${creators.length} creators`);

  // ── Brands ─────────────────────────────────────────────────────────────────
  type BrandDef = { email: string; displayName: string; company: string; industry: string; website: string; description: string; country: string; plan: PlanTier };
  const brands: BrandDef[] = [
    { email: 'marketing@noon-fashion.com', displayName: 'Noon Fashion',    company: 'Noon Fashion',    industry: 'Fashion & Apparel', website: 'https://fashion.noon.com',    description: "The Middle East's leading fashion e-commerce platform.",         country: 'United Arab Emirates', plan: PlanTier.ENTERPRISE },
    { email: 'brand@emaar-lifestyle.com',  displayName: 'Emaar Lifestyle', company: 'Emaar Lifestyle', industry: 'Real Estate',        website: 'https://emaar.com',            description: "Emaar Properties — developers of Dubai's iconic destinations.",   country: 'United Arab Emirates', plan: PlanTier.PROFESSIONAL },
    { email: 'social@saudia-airlines.com', displayName: 'Saudia Airlines', company: 'Saudia Airlines', industry: 'Travel & Tourism',   website: 'https://www.saudia.com',       description: "Saudi Arabia's national carrier. Stories of discovery and connection.", country: 'Saudi Arabia',         plan: PlanTier.ENTERPRISE },
    { email: 'digital@talabat-mena.com',   displayName: 'Talabat MENA',    company: 'Talabat',         industry: 'Food & Beverage',    website: 'https://www.talabat.com',      description: "The region's go-to food delivery platform.",                     country: 'United Arab Emirates', plan: PlanTier.PROFESSIONAL },
    { email: 'influencer@apparel.ae',      displayName: 'Desert Threads',  company: 'Desert Threads',  industry: 'Fashion & Apparel',  website: 'https://desertthreads.ae',     description: 'Contemporary UAE fashion blending Gulf aesthetics with modern streetwear.', country: 'United Arab Emirates', plan: PlanTier.FREE },
  ];

  const brandProfileIds: string[] = [];
  for (const b of brands) {
    let existing = await prisma.user.findUnique({ where: { email: b.email }, include: { brandProfile: true } });
    if (existing?.brandProfile) { brandProfileIds.push(existing.brandProfile.id); continue; }
    const user = await prisma.user.create({
      data: {
        email: b.email, passwordHash: await hash(SEED_PASSWORD), status: 'ACTIVE', roleId: roleMap.BRAND,
        profile: { create: { displayName: b.displayName, country: b.country, languages: ['English', 'Arabic'] } },
        brandProfile: { create: { companyName: b.company, industry: b.industry, website: b.website, description: b.description, country: b.country } },
      },
      include: { brandProfile: true },
    });
    if (user.brandProfile) brandProfileIds.push(user.brandProfile.id);
  }
  console.log(`✓ ${brands.length} brands`);

  // ── Campaigns ───────────────────────────────────────────────────────────────
  const now = new Date();
  type M = { reach: number; impressions: number; engagement: number; clicks: number; conversions: number; cpe: number; roi: number };
  type CampaignDef = { brandIdx: number; title: string; description: string; type: CampaignType; status: CampaignStatus; budget: number; audience: string; locations: string[]; categories: string[]; deadline: Date; requirements: string; metrics: M[] };

  const campaignDefs: CampaignDef[] = [
    { brandIdx: 0, title: 'Ramadan Style Edit 2026', description: 'Showcase our Ramadan collection — modest fashion, festive looks, and gift sets. Storytelling-first content.', type: CampaignType.AWARENESS, status: CampaignStatus.ACTIVE, budget: 25000, audience: 'Women 18-35 across UAE, Saudi Arabia and Egypt who shop fashion online.', locations: ['UAE', 'Saudi Arabia', 'Egypt'], categories: ['Fashion', 'Beauty', 'Lifestyle'], deadline: new Date(now.getTime() + 30 * 86400000), requirements: 'Min 100K followers. 2 Reels + 3 Stories per collab. Authentic tone.', metrics: [{ reach: 480000, impressions: 1200000, engagement: 38400, clicks: 12800, conversions: 960, cpe: 0.65, roi: 3.2 }, { reach: 620000, impressions: 1550000, engagement: 52700, clicks: 18900, conversions: 1420, cpe: 0.47, roi: 4.1 }] },
    { brandIdx: 0, title: 'Summer Swimwear Drop', description: 'Launch our resort & swimwear line. Creators who can shoot at Dubai pools and beaches.', type: CampaignType.SALES, status: CampaignStatus.DRAFT, budget: 18000, audience: 'Women 20-40, UAE + Gulf region. Travel, beach lifestyle, luxury.', locations: ['UAE', 'Qatar', 'Bahrain'], categories: ['Fashion', 'Travel', 'Lifestyle'], deadline: new Date(now.getTime() + 45 * 86400000), requirements: 'Beach / resort portfolio. 50K+ followers.', metrics: [] },
    { brandIdx: 1, title: 'Dubai Hills Estate — Dream Home Series', description: 'Document the Dubai Hills lifestyle — community walks, morning routines, family moments.', type: CampaignType.AWARENESS, status: CampaignStatus.ACTIVE, budget: 40000, audience: 'HNW families and professionals 28-50 considering premium residential.', locations: ['UAE', 'Saudi Arabia', 'Kuwait'], categories: ['Lifestyle', 'Travel', 'Business'], deadline: new Date(now.getTime() + 60 * 86400000), requirements: 'Premium feel. Creators visit site for shoot. 200K+ audience preferred.', metrics: [{ reach: 290000, impressions: 870000, engagement: 17400, clicks: 8700, conversions: 120, cpe: 2.30, roi: 5.8 }] },
    { brandIdx: 2, title: 'Discover Saudi — Travel Campaign', description: 'Show the beauty of Saudi Arabia through authentic travel storytelling. AlUla, Diriyah, Jeddah.', type: CampaignType.ENGAGEMENT, status: CampaignStatus.ACTIVE, budget: 55000, audience: 'Travel enthusiasts 22-45 across MENA.', locations: ['Saudi Arabia', 'UAE', 'Egypt', 'Jordan'], categories: ['Travel', 'Lifestyle', 'Food'], deadline: new Date(now.getTime() + 90 * 86400000), requirements: 'Full trip coverage preferred. Must disclose partnership. YouTube welcome.', metrics: [{ reach: 910000, impressions: 2730000, engagement: 72800, clicks: 27300, conversions: 820, cpe: 0.76, roi: 2.9 }, { reach: 1050000, impressions: 3150000, engagement: 89250, clicks: 33600, conversions: 1010, cpe: 0.62, roi: 3.4 }] },
    { brandIdx: 3, title: 'Ramadan Night Bites — Suhoor Series', description: 'Showcase the Ramadan late-night food experience. Suhoor spreads, best restaurants, hidden gems.', type: CampaignType.ENGAGEMENT, status: CampaignStatus.COMPLETED, budget: 12000, audience: 'Food lovers 18-35 UAE and Kuwait.', locations: ['UAE', 'Kuwait'], categories: ['Food', 'Lifestyle'], deadline: new Date(now.getTime() - 10 * 86400000), requirements: 'Food photography skills a must. Must order live via Talabat.', metrics: [{ reach: 195000, impressions: 585000, engagement: 17550, clicks: 9750, conversions: 2340, cpe: 0.68, roi: 4.2 }, { reach: 245000, impressions: 735000, engagement: 22050, clicks: 12250, conversions: 2940, cpe: 0.54, roi: 5.1 }, { reach: 198000, impressions: 594000, engagement: 17820, clicks: 9900, conversions: 2376, cpe: 0.67, roi: 4.3 }] },
    { brandIdx: 4, title: 'Street Style Doha — New Collection', description: 'Capture our Khaleeji streetwear line in Doha street scenes. Modern Gulf fashion for youth.', type: CampaignType.SALES, status: CampaignStatus.DRAFT, budget: 5000, audience: 'Young Gulf nationals 16-28 into streetwear.', locations: ['Qatar', 'UAE', 'Bahrain'], categories: ['Fashion', 'Lifestyle'], deadline: new Date(now.getTime() + 20 * 86400000), requirements: '20K+ followers. Must style own outfit using our pieces.', metrics: [] },
  ];

  const campaignIds: string[] = [];
  for (const cd of campaignDefs) {
    const campaign = await prisma.campaign.create({
      data: {
        brandId: brandProfileIds[cd.brandIdx], title: cd.title, description: cd.description,
        type: cd.type, status: cd.status, budgetUsd: cd.budget,
        targetAudience: cd.audience, targetLocations: cd.locations, targetCategories: cd.categories,
        deadline: cd.deadline, requirements: cd.requirements,
        metrics: { create: cd.metrics.map((m, i) => ({ reach: m.reach, impressions: m.impressions, engagement: m.engagement, clicks: m.clicks, conversions: m.conversions, costPerEngagement: m.cpe, roiEstimate: m.roi, recordedAt: new Date(now.getTime() - (cd.metrics.length - i) * 7 * 86400000) })) },
      },
    });
    campaignIds.push(campaign.id);
  }
  console.log(`✓ ${campaignDefs.length} campaigns (with metrics)`);

  // ── Invitations ─────────────────────────────────────────────────────────────
  const invitations = [
    { ci: 0, cr: 0, status: InvitationStatus.ACCEPTED, msg: "We loved your Ramadan content last year, Layla! Would love to collaborate." },
    { ci: 0, cr: 2, status: InvitationStatus.ACCEPTED, msg: "Your aesthetic is perfect for our Ramadan collection, Nour." },
    { ci: 0, cr: 6, status: InvitationStatus.PENDING,  msg: "Dina, your beauty content would be a great fit for our accessories line." },
    { ci: 2, cr: 4, status: InvitationStatus.ACCEPTED, msg: "Sara, your luxury travel content is exactly what we need for Dubai Hills." },
    { ci: 2, cr: 3, status: InvitationStatus.PENDING,  msg: "Ahmed, we think a fitness lifestyle angle would be fresh for our community." },
    { ci: 3, cr: 4, status: InvitationStatus.ACCEPTED, msg: "Sara, would love to fly you to AlUla for a week-long content trip." },
    { ci: 3, cr: 2, status: InvitationStatus.DECLINED, msg: "Nour, your food angle for Saudi cuisine would be perfect." },
    { ci: 4, cr: 2, status: InvitationStatus.ACCEPTED, msg: "Nour, you're our top pick for the Suhoor series!" },
    { ci: 4, cr: 0, status: InvitationStatus.PENDING,  msg: "Layla, would love to feature your Ramadan night routine." },
  ];
  for (const inv of invitations) {
    const cId = creatorProfileIds[inv.cr]; const cpId = campaignIds[inv.ci];
    if (!cId || !cpId) continue;
    const ex = await prisma.campaignInvitation.findUnique({ where: { campaignId_creatorId: { campaignId: cpId, creatorId: cId } } });
    if (!ex) await prisma.campaignInvitation.create({ data: { campaignId: cpId, creatorId: cId, status: inv.status, message: inv.msg } });
  }
  console.log(`✓ ${invitations.length} invitations`);

  // ── Proposals ───────────────────────────────────────────────────────────────
  const proposals = [
    { ci: 0, cr: 1, rate: 2800, status: ProposalStatus.PENDING,  letter: "Hi Noon Fashion! I specialise in tech & lifestyle. For Ramadan I'd focus on gifting — smart home accessories, wearables, and the tech side of modern Gulf living." },
    { ci: 3, cr: 1, rate: 4500, status: ProposalStatus.ACCEPTED, letter: "Love the Discover Saudi initiative. I'd document tech infrastructure and futuristic projects — NEOM, smart cities — alongside cultural heritage. A unique angle." },
    { ci: 2, cr: 6, rate: 1200, status: ProposalStatus.PENDING,  letter: "Beauty meets luxury real estate — my Cairo audience dreams of Dubai living. I can create stunning content showcasing the lifestyle at Dubai Hills." },
    { ci: 5, cr: 5, rate: 1500, status: ProposalStatus.REJECTED, letter: "Gaming streetwear crossover is huge right now. My Oman audience is young and style-conscious. I'd blend gaming culture with Gulf fashion." },
  ];
  for (const p of proposals) {
    const cId = creatorProfileIds[p.cr]; const cpId = campaignIds[p.ci];
    if (!cId || !cpId) continue;
    const ex = await prisma.proposal.findUnique({ where: { campaignId_creatorId: { campaignId: cpId, creatorId: cId } } });
    if (!ex) await prisma.proposal.create({ data: { campaignId: cpId, creatorId: cId, coverLetter: p.letter, proposedRate: p.rate, status: p.status } });
  }
  console.log(`✓ ${proposals.length} proposals`);

  // ── Subscriptions ────────────────────────────────────────────────────────────
  for (const b of brands) {
    const u = await prisma.user.findUnique({ where: { email: b.email } });
    if (!u) continue;
    const ex = await prisma.subscription.findUnique({ where: { userId: u.id } });
    if (ex) continue;
    const sub = await prisma.subscription.create({ data: { userId: u.id, plan: b.plan, status: 'ACTIVE', currentPeriodEnd: new Date(now.getTime() + 30 * 86400000) } });
    if (b.plan !== PlanTier.FREE) {
      await prisma.invoice.create({ data: { subscriptionId: sub.id, stripeInvoiceId: `inv_demo_${u.id.slice(0, 8)}`, amountUsd: b.plan === PlanTier.ENTERPRISE ? 299 : 99, status: 'paid', createdAt: new Date(now.getTime() - 30 * 86400000) } });
    }
  }
  console.log('✓ Subscriptions & invoices');

  // ── Fraud reports ────────────────────────────────────────────────────────────
  const fraudRows = [
    { idx: 4, score: 44, level: 'MEDIUM', flags: ['low_comment_ratio'],                          engAnon: 0.15, folAnon: 0.08, summary: 'Comment ratio below expected for follower count. Likely organic but warrants monitoring.' },
    { idx: 5, score: 67, level: 'HIGH',   flags: ['engagement_anomaly', 'sudden_follower_spike'], engAnon: 0.42, folAnon: 0.38, summary: '40% follower spike over 2 weeks with no corresponding viral content. Engagement inconsistent.' },
  ];
  for (const fr of fraudRows) {
    const cId = creatorProfileIds[fr.idx];
    if (cId) await prisma.fraudReport.create({ data: { creatorId: cId, riskScore: fr.score, riskLevel: fr.level, flags: fr.flags, summary: fr.summary, engagementAnom: fr.engAnon, followerAnom: fr.folAnon } });
  }
  console.log('✓ Fraud reports');

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifs = [
    { email: 'layla.hassan@demo.com',   type: 'INVITATION',      title: 'New campaign invitation', body: 'Noon Fashion invited you to their Ramadan Style Edit campaign.',    link: '/dashboard/creator/inbox' },
    { email: 'layla.hassan@demo.com',   type: 'MESSAGE',         title: 'New message',              body: 'You have a new message from Noon Fashion.',                         link: '/messages' },
    { email: 'omar.khalid@demo.com',    type: 'PROPOSAL_UPDATE', title: 'Proposal accepted',        body: 'Your proposal for the Discover Saudi campaign was accepted!',       link: '/dashboard/creator/inbox' },
    { email: 'nour.al.rashid@demo.com', type: 'INVITATION',      title: 'New campaign invitation', body: 'Talabat has invited you to their Suhoor Series campaign.',          link: '/dashboard/creator/inbox' },
    { email: 'sara.travels@demo.com',   type: 'INVITATION',      title: 'New campaign invitation', body: 'Saudia Airlines wants to fly you to AlUla for a content trip.',     link: '/dashboard/creator/inbox' },
    { email: 'dina.beauty@demo.com',    type: 'INVITATION',      title: 'New campaign invitation', body: 'Noon Fashion invited you to collaborate on their accessories line.', link: '/dashboard/creator/inbox' },
    { email: 'faisal.finance@demo.com', type: 'SYSTEM',          title: 'Profile tip',             body: 'Add a portfolio item to increase your visibility by 40%.',          link: '/dashboard/creator/profile' },
  ];
  for (const n of notifs) {
    const u = await prisma.user.findUnique({ where: { email: n.email } });
    if (u) await prisma.notification.create({ data: { userId: u.id, type: n.type, title: n.title, body: n.body, link: n.link } });
  }
  console.log('✓ Notifications');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed complete — demo password: ${SEED_PASSWORD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 ADMIN    admin@infludubai.com            Admin123!

 BRANDS   (password: ${SEED_PASSWORD})
   Noon Fashion     marketing@noon-fashion.com   ENTERPRISE
   Emaar Lifestyle  brand@emaar-lifestyle.com    PROFESSIONAL
   Saudia Airlines  social@saudia-airlines.com   ENTERPRISE
   Talabat          digital@talabat-mena.com     PROFESSIONAL
   Desert Threads   influencer@apparel.ae        FREE

 CREATORS (password: ${SEED_PASSWORD})
   Layla Hassan      layla.hassan@demo.com        796K  LOW fraud
   Omar Khalid       omar.khalid@demo.com         533K  LOW fraud
   Nour Al Rashid    nour.al.rashid@demo.com      406K  LOW fraud
   Ahmed Fitness     ahmed.fitness@demo.com       210K  LOW fraud
   Sara Mahmoud      sara.travels@demo.com        1.07M MEDIUM fraud
   Khalid Al Amri    khalid.gaming@demo.com       475K  HIGH fraud ⚠
   Dina Karimi       dina.beauty@demo.com         665K  LOW fraud
   Faisal Al Dossary faisal.finance@demo.com      305K  LOW fraud
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
