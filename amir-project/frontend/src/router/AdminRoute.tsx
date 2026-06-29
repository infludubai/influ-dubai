import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PageLoader from '@/components/shared/PageLoader'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return <div className="pt-24"><PageLoader /></div>
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
