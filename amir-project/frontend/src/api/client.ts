import axios from "axios"

import { safeLocalStorage } from "@/utils/safeStorage"
import { useAuthStore } from "@/store/authStore"

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || "/api",
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
})

// Attach Bearer token + fix Content-Type for FormData uploads
api.interceptors.request.use((config) => {
  try {
    const raw = safeLocalStorage.getItem("auth-storage")
    if (raw) {
      const parsed = JSON.parse(raw)
      const token: string | undefined = parsed?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch { /* noop */ }

  // When sending FormData, remove the global Content-Type header so
  // axios sets it automatically as multipart/form-data with the correct boundary.
  // Without this, the global "application/json" header causes Laravel to see
  // an empty file and return 422 Unprocessable Content.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]
  }

  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      safeLocalStorage.removeItem("auth-storage")
      useAuthStore.getState().logout()
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
      }
    }
    return Promise.reject(error)
  }
)

export default api
