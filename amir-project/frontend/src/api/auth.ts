import api from './client'

export const authApi = {
  login: (login: string, password: string) =>
    api.post('/auth/login', { login, password }),

  register: (data: { name: string; email: string; phone?: string; password: string; password_confirmation: string }) =>
    api.post('/auth/register', data),

  verifyEmail: (user_id: number, otp: string) =>
    api.post('/auth/verify-email', { user_id, otp }),

  verifyDevice: (user_id: number, otp: string) =>
    api.post('/auth/verify-device', { user_id, otp }),

  resendOtp: (user_id: number, type: string) =>
    api.post('/auth/resend-otp', { user_id, type }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { user_id: number; otp: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', data),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  updateProfile: (data: { name?: string; username?: string; phone?: string }) =>
    api.put('/auth/profile', data),

  googleAuthUrl: () =>
    api.get('/auth/google/url'),

  googleCallback: (code: string) =>
    api.post('/auth/google/callback', { code }),

  githubAuthUrl: () =>
    api.get('/auth/github/url'),

  githubCallback: (code: string) =>
    api.post('/auth/github/callback', { code }),
}
