import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return <>{children}</>
}
