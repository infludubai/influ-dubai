/**
 * Google OAuth Callback Handler
 * Receives authorization code from Google and exchanges it for auth token
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'
import { safeLocalStorage, safeSessionStorage } from '@/utils/safeStorage'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [params] = useSearchParams()
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')
  const returnTo = safeSessionStorage.getItem('oauth_return_to')

  useEffect(() => {
    if (error) {
      toast.error(`Google OAuth error: ${error}`)
      navigate('/login')
      return
    }

    if (!code) {
      toast.error('No authorization code received')
      navigate('/login')
      return
    }

    // Exchange code for token
    authApi.googleCallback(code)
      .then(res => {
        const { user, token } = res.data
        setAuth(user, token)
        toast.success(`Welcome, ${user.name.split(' ')[0]}!`)

        // Clear stored return path
        safeSessionStorage.removeItem('oauth_return_to')

        if (user.role === 'admin') {
          navigate('/admin')
        } else {
          // Show onboarding for new Google users who haven't completed it
          const onboardingDone = safeLocalStorage.getItem('onboarding_done')
          const isNewUser = !user.phone && !user.company_name
          if (!onboardingDone && isNewUser) {
            navigate('/onboarding')
          } else {
            navigate(returnTo || '/dashboard')
          }
        }
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Google login failed'
        toast.error(msg)
        navigate('/login')
      })
  }, [code, error, setAuth, navigate, returnTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Signing you in with Google...</p>
      </div>
    </div>
  )
}
