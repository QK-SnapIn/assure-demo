import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/auth'

interface Props {
  children: React.ReactNode
}

export default function RequireAuth({ children }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
