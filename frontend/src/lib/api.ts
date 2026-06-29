const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = body?.message ?? res.statusText;
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }

  return body as T;
}

export interface AuthUser {
  id: string;
  email: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";
  role: "CREATOR" | "BRAND" | "AGENCY" | "ADMIN";
  displayName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  bio: string | null;
  location: string | null;
  languages: string[];
  categories: string[];
  minRateUsd: number | null;
  maxRateUsd: number | null;
  totalAudienceSize: number | null;
  mediaKitUrl: string | null;
  profileImageUrl: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  fraudRiskScore?: number | null;
  fraudRiskLevel?: string | null;
  fraudFlags?: string[];
  fraudAnalyzedAt?: string | null;
  socialAccounts: SocialAccount[];
  portfolioItems: PortfolioItem[];
  user?: { profile: { displayName: string } | null };
}

export interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN" | "X";
  handle: string;
  followersCount: number | null;
  engagementRate: number | null;
  profileUrl: string | null;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  linkUrl: string | null;
}

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  industry: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  country: string | null;
  campaigns?: Campaign[];
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string | null;
  type: "AWARENESS" | "ENGAGEMENT" | "LEAD_GENERATION" | "SALES";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  budgetUsd: number;
  targetAudience: string | null;
  targetLocations: string[];
  targetCategories: string[];
  deadline: string | null;
  requirements: string | null;
  createdAt: string;
  brand?: BrandProfile;
}

export const api = {
  register: (data: { email: string; password: string; displayName: string; role: string }) =>
    request<AuthUser>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  verifyEmail: (token: string) =>
    request<{ verified: boolean }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: (email: string) =>
    request<{ sent: boolean }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    request<{ sent: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ reset: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  me: (accessToken: string) =>
    request<{
      id: string;
      email: string;
      status: string;
      role: string;
      profile: { displayName: string; bio: string | null; country: string | null; city: string | null; languages: string[]; categories: string[] } | null;
    }>("/users/me", { accessToken }),

  updateProfile: (
    accessToken: string,
    data: { bio?: string; country?: string; city?: string; languages?: string[]; categories?: string[] }
  ) =>
    request("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
      accessToken,
    }),

  // Creator Profile
  getMyCreatorProfile: (accessToken: string) =>
    request<{ profile: CreatorProfile | null; completionScore: number }>("/creators/me/profile", { accessToken }),

  upsertCreatorProfile: (accessToken: string, data: Partial<Pick<CreatorProfile, "bio" | "location" | "languages" | "categories" | "minRateUsd" | "maxRateUsd" | "totalAudienceSize">>) =>
    request<CreatorProfile>("/creators/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
      accessToken,
    }),

  upsertSocialAccount: (accessToken: string, data: { platform: string; handle: string; followersCount?: number; engagementRate?: number; profileUrl?: string }) =>
    request<SocialAccount>("/creators/me/social-accounts", {
      method: "POST",
      body: JSON.stringify(data),
      accessToken,
    }),

  deleteSocialAccount: (accessToken: string, platform: string) =>
    request<void>(`/creators/me/social-accounts/${platform}`, { method: "DELETE", accessToken }),

  createPortfolioItem: (accessToken: string, data: { title: string; description?: string; linkUrl?: string }) =>
    request<PortfolioItem>("/creators/me/portfolio", {
      method: "POST",
      body: JSON.stringify(data),
      accessToken,
    }),

  deletePortfolioItem: (accessToken: string, id: string) =>
    request<void>(`/creators/me/portfolio/${id}`, { method: "DELETE", accessToken }),

  getPublicCreatorProfile: (id: string) =>
    request<CreatorProfile>(`/creators/${id}`),

  // Brand Profile
  getMyBrandProfile: (accessToken: string) =>
    request<BrandProfile | null>("/brands/me/profile", { accessToken }),

  upsertBrandProfile: (accessToken: string, data: { companyName: string; industry?: string; website?: string; description?: string; country?: string }) =>
    request<BrandProfile>("/brands/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
      accessToken,
    }),

  // Campaigns
  createCampaign: (accessToken: string, data: Partial<Campaign> & { title: string; type: string; budgetUsd: number }) =>
    request<Campaign>("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
      accessToken,
    }),

  getMyCampaigns: (accessToken: string) =>
    request<Campaign[]>("/campaigns/me/all", { accessToken }),

  listPublicCampaigns: (params: { type?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.type)  qs.set("type",  params.type);
    if (params.page)  qs.set("page",  String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<{ items: Array<Campaign & { brand: { companyName: string; logoUrl: string | null } }>; total: number; page: number; limit: number }>(`/campaigns${q ? "?" + q : ""}`);
  },

  getCampaign: (id: string, accessToken?: string) =>
    request<Campaign>(`/campaigns/${id}`, accessToken ? { accessToken } : {}),

  updateCampaign: (accessToken: string, id: string, data: Partial<Campaign>) =>
    request<Campaign>(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      accessToken,
    }),

  deleteCampaign: (accessToken: string, id: string) =>
    request<void>(`/campaigns/${id}`, { method: "DELETE", accessToken }),

  getCampaignRecommendations: (accessToken: string, campaignId: string) =>
    request<Array<{
      creatorProfileId: string;
      displayName: string;
      location: string | null;
      categories: string[];
      languages: string[];
      minRateUsd: number | null;
      maxRateUsd: number | null;
      totalAudienceSize: number | null;
      profileImageUrl: string | null;
      verificationStatus: string;
      socialAccounts: SocialAccount[];
      score: number;
      scoreBreakdown: { categoryScore: number; locationScore: number; budgetScore: number; audienceScore: number };
    }>>(`/campaigns/${campaignId}/recommendations`, { accessToken }),

  // Billing
  getPlans: () =>
    request<Record<string, { name: string; priceUsd: number; campaigns: number; creators: number; aiInsights: boolean; analytics: boolean; support: string }>>('/billing/plans'),

  getSubscription: (accessToken: string) =>
    request<{
      id: string; plan: string; status: string;
      currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
      invoices: Array<{ id: string; amountUsd: number; status: string; pdfUrl: string | null; createdAt: string }>;
    }>('/billing/subscription', { accessToken }),

  createCheckout: (accessToken: string, plan: 'PROFESSIONAL' | 'ENTERPRISE') =>
    request<{ url: string; mock: boolean }>('/billing/checkout', {
      method: 'POST', body: JSON.stringify({ plan }), accessToken,
    }),

  createPortal: (accessToken: string) =>
    request<{ url: string; mock: boolean }>('/billing/portal', {
      method: 'POST', body: JSON.stringify({}), accessToken,
    }),

  cancelSubscription: (accessToken: string) =>
    request<{ cancelled: boolean }>('/billing/cancel', { method: 'POST', accessToken }),

  // AI
  analyzeCreator: (accessToken: string, creatorProfileId: string) =>
    request<{
      qualityScore: number;
      audienceSummary: string;
      strengths: string[];
      contentSuggestions: string[];
      estimatedReach: string;
      bestPlatform: string | null;
      aiGenerated: boolean;
    }>(`/ai/creator/${creatorProfileId}/analyze`, { method: 'POST', accessToken }),

  getCampaignAiSuggestions: (accessToken: string, campaignId: string) =>
    request<Array<{
      creatorProfileId: string;
      displayName: string;
      reason: string;
      fitScore: number;
      suggestedRate: string;
    }>>(`/ai/campaign/${campaignId}/suggest`, { method: 'POST', accessToken }),

  // Analytics
  getBrandOverview: (accessToken: string) =>
    request<{
      campaigns: Array<{ id: string; title: string; status: string; budgetUsd: number; reach: number; engagement: number; conversions: number; roiEstimate: number | null }>;
      totals: { totalBudget: number; totalReach: number; totalEngagement: number; totalConversions: number };
    }>('/analytics/brand/overview', { accessToken }),

  getCampaignAnalytics: (accessToken: string, campaignId: string) =>
    request<{
      campaign: { id: string; title: string; budgetUsd: number; status: string };
      metrics: Array<{ reach: number; impressions: number; engagement: number; clicks: number; conversions: number; recordedAt: string }>;
      totals: { reach: number; impressions: number; engagement: number; clicks: number; conversions: number };
      engagementRate: number;
      ctr: number;
      costPerEngagement: number | null;
      roiEstimate: number | null;
    }>(`/analytics/campaigns/${campaignId}`, { accessToken }),

  recordMetric: (accessToken: string, campaignId: string, data: { reach: number; impressions: number; engagement: number; clicks: number; conversions: number }) =>
    request<unknown>(`/analytics/campaigns/${campaignId}/metrics`, { method: 'POST', body: JSON.stringify(data), accessToken }),

  getCreatorAnalytics: (accessToken: string) =>
    request<{
      campaigns: Array<{ id: string; title: string; status: string; reach: number; engagement: number; conversions: number }>;
      totals: { totalReach: number; totalEngagement: number; totalConversions: number };
    }>('/analytics/creator/overview', { accessToken }),

  // Invitations
  inviteCreator: (accessToken: string, campaignId: string, creatorId: string, message?: string) =>
    request<{ id: string; status: string }>(`/campaigns/${campaignId}/invitations`, {
      method: 'POST', body: JSON.stringify({ creatorId, message }), accessToken,
    }),

  getMyInvitations: (accessToken: string) =>
    request<Array<{ id: string; status: string; message: string | null; campaign: Campaign & { brand: { companyName: string } }; createdAt: string }>>('/invitations/me', { accessToken }),

  respondToInvitation: (accessToken: string, id: string, status: 'ACCEPTED' | 'DECLINED') =>
    request<{ id: string; status: string }>(`/invitations/${id}/respond`, {
      method: 'PATCH', body: JSON.stringify({ status }), accessToken,
    }),

  // Proposals
  submitProposal: (accessToken: string, campaignId: string, data: { coverLetter: string; proposedRate?: number }) =>
    request<{ id: string; status: string }>(`/campaigns/${campaignId}/proposals`, {
      method: 'POST', body: JSON.stringify(data), accessToken,
    }),

  getCampaignProposals: (accessToken: string, campaignId: string) =>
    request<Array<{ id: string; coverLetter: string; proposedRate: number | null; status: string; createdAt: string; creator: any }>>(`/campaigns/${campaignId}/proposals`, { accessToken }),

  getMyProposals: (accessToken: string) =>
    request<Array<{ id: string; coverLetter: string; proposedRate: number | null; status: string; createdAt: string; campaign: Campaign & { brand: { companyName: string } } }>>('/proposals/me', { accessToken }),

  respondToProposal: (accessToken: string, id: string, status: 'ACCEPTED' | 'REJECTED') =>
    request<{ id: string; status: string }>(`/proposals/${id}/respond`, {
      method: 'PATCH', body: JSON.stringify({ status }), accessToken,
    }),

  withdrawProposal: (accessToken: string, id: string) =>
    request<{ id: string; status: string }>(`/proposals/${id}/withdraw`, {
      method: 'PATCH', accessToken,
    }),

  // Notifications
  getNotifications: (accessToken: string) =>
    request<Array<{ id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }>>('/notifications', { accessToken }),

  getUnreadCount: (accessToken: string) =>
    request<number>('/notifications/unread-count', { accessToken }),

  markNotificationRead: (accessToken: string, id: string) =>
    request<unknown>(`/notifications/${id}/read`, { method: 'PATCH', accessToken }),

  markAllNotificationsRead: (accessToken: string) =>
    request<unknown>('/notifications/mark-all-read', { method: 'PATCH', accessToken }),

  // Conversations
  listConversations: (accessToken: string) =>
    request<Array<{ id: string; participant1: string; participant2: string; otherId: string; unread: number; otherDisplayName: string | null; otherImageUrl: string | null; otherRole: string | null; messages: Array<{ content: string; createdAt: string }> }>>('/conversations', { accessToken }),

  startConversation: (accessToken: string, otherUserId: string) =>
    request<{ id: string }>(`/conversations/with/${otherUserId}`, { method: 'POST', accessToken }),

  getMessages: (accessToken: string, conversationId: string) =>
    request<Array<{ id: string; senderId: string; content: string; readAt: string | null; createdAt: string }>>(`/conversations/${conversationId}/messages`, { accessToken }),

  sendMessage: (accessToken: string, conversationId: string, content: string) =>
    request<{ id: string; content: string; createdAt: string }>(`/conversations/${conversationId}/messages`, {
      method: 'POST', body: JSON.stringify({ content }), accessToken,
    }),

  listCreators: (params?: {
    category?: string; location?: string; language?: string;
    minFollowers?: number; maxFollowers?: number;
    minRate?: number; maxRate?: number; page?: number; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    }
    return request<{ items: CreatorProfile[]; total: number; page: number; limit: number }>(`/creators?${qs}`);
  },

  // Admin
  adminGetStats: (accessToken: string) =>
    request<{ totalUsers: number; totalCreators: number; totalBrands: number; totalCampaigns: number; activeCampaigns: number; totalMessages: number; totalRevenueUsd: number }>('/admin/stats', { accessToken }),

  adminListUsers: (accessToken: string, params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return request<{ users: Array<{ id: string; email: string; status: string; createdAt: string; role: { name: string }; profile: { displayName: string; avatarUrl: string | null } | null }>; total: number; page: number; limit: number }>(`/admin/users?${qs}`, { accessToken });
  },

  adminUpdateUserStatus: (accessToken: string, userId: string, status: string) =>
    request<unknown>(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), accessToken }),

  adminDeleteUser: (accessToken: string, userId: string) =>
    request<unknown>(`/admin/users/${userId}`, { method: 'DELETE', accessToken }),

  adminListCampaigns: (accessToken: string, params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return request<{ campaigns: Array<{ id: string; title: string; status: string; budgetUsd: number; createdAt: string; brand: { companyName: string }; _count: { invitations: number; proposals: number } }>; total: number; page: number; limit: number }>(`/admin/campaigns?${qs}`, { accessToken });
  },

  adminUpdateCampaignStatus: (accessToken: string, campaignId: string, status: string) =>
    request<unknown>(`/admin/campaigns/${campaignId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), accessToken }),

  adminGetRevenue: (accessToken: string) =>
    request<{ recentInvoices: Array<{ id: string; amountUsd: number; status: string; createdAt: string }>; byPlan: Array<{ plan: string; count: number; total: number }> }>('/admin/revenue', { accessToken }),

  adminGetLogs: (accessToken: string, page = 1) =>
    request<{ log: Array<{ type: string; at: string; detail: string }>; page: number; limit: number }>(`/admin/logs?page=${page}`, { accessToken }),

  // Fraud detection
  analyzeFraud: (accessToken: string, creatorProfileId: string) =>
    request<{
      riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      flags: string[]; engagementAnomaly: number | null;
      followerAnomaly: number | null; summary: string; aiGenerated: boolean;
    }>(`/fraud/analyze/${creatorProfileId}`, { method: 'POST', accessToken }),

  getFraudHistory: (accessToken: string, creatorProfileId: string) =>
    request<Array<{ id: string; riskScore: number; riskLevel: string; flags: string[]; summary: string | null; createdAt: string }>>(`/fraud/history/${creatorProfileId}`, { accessToken }),

  adminGetFraudStats: (accessToken: string) =>
    request<{ analyzed: number; high: number; medium: number; low: number; recentReports: Array<{ id: string; riskScore: number; riskLevel: string; flags: string[]; createdAt: string }> }>('/fraud/stats', { accessToken }),

  adminScanAllFraud: (accessToken: string) =>
    request<{ scanned: number; flagged: number; results: Array<{ creatorId: string; riskScore: number; riskLevel: string }> }>('/fraud/scan-all', { method: 'POST', accessToken }),

  // AI Campaign Predictor
  predictCampaign: (accessToken: string, campaignId: string) =>
    request<{
      estimatedReach: number;
      estimatedEngagement: number;
      estimatedConversions: number;
      estimatedCPE: number;
      estimatedROI: number;
      confidence: number;
      matchingCreators: number;
      historicalSampleSize: number;
      narrative: string;
      tips?: string[];
      aiGenerated: boolean;
    }>(`/ai/campaign/${campaignId}/predict`, { method: 'POST', accessToken }),

  // GDPR
  exportMyData: (accessToken: string) =>
    request<Record<string, unknown>>('/users/me/export', { accessToken }),

  deleteMyAccount: (accessToken: string) =>
    request<{ deleted: boolean }>('/users/me', { method: 'DELETE', accessToken }),
};
