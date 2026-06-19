import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "./api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (session: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}

// Persisted to localStorage so a refresh doesn't kick the user back to
// login. Phase 2 keeps it simple (no silent-refresh-on-expiry yet) —
// access tokens are short-lived (15m); revisit if that proves annoying.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "infludubai-auth" }
  )
);
