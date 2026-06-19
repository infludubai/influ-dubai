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
};
