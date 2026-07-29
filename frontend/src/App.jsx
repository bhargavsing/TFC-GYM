import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.js'
import { AdminShell } from './components/AdminShell.jsx'
import { LoginPage } from './components/auth/LoginPage.jsx'
import { RoleSelectionPage } from './components/public/RoleSelectionPage.jsx'
import { LandingPage } from './components/public/LandingPage.jsx'
import { PlansPage } from './components/public/PlansPage.jsx'
import { TurfPage } from './components/public/TurfPage.jsx'
import { TrainersPage } from './components/public/TrainersPage.jsx'
import { FeedbackPage } from './components/public/FeedbackPage.jsx'
import { DashboardPage } from './components/admin/DashboardPage.jsx'
import { MembersPage } from './components/admin/MembersPage.jsx'
import { PaymentsPage } from './components/admin/PaymentsPage.jsx'
import { TurfManagementPage } from './components/admin/TurfManagementPage.jsx'
import { BookingsPage } from './components/admin/BookingsPage.jsx'
import { AdminFeedbackPage } from './components/admin/FeedbackPage.jsx'
import { PartnersPage } from './components/admin/PartnersPage.jsx'
import { ProfilePage } from './components/admin/ProfilePage.jsx'

function PublicRoute({ children }) {
  const location = useLocation()
  const selectedMode = sessionStorage.getItem('tfc_access_mode')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && location.pathname === '/admin/login') {
    return <Navigate replace to="/admin/dashboard" />
  }

  if (!selectedMode && location.pathname !== '/select-role') {
    return <Navigate replace to="/select-role" />
  }

  return children
}

function ProtectedAdminRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const loadMe = useAuthStore((state) => state.loadMe)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    let mounted = true

    async function verify() {
      if (!isAuthenticated) {
        setAllowed(false)
        setChecked(true)
        return
      }

      try {
        await loadMe()
        if (mounted) setAllowed(true)
      } catch {
        window.localStorage.removeItem('tfc_access_token')
        if (mounted) setAllowed(false)
      } finally {
        if (mounted) setChecked(true)
      }
    }

    verify()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, loadMe])

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#09090B] text-slate-100">
        <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-10">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/90 p-10 text-center shadow-[0_40px_120px_rgba(0,0,0,0.28)]">
            <p className="text-xl font-semibold text-white">Verifying admin access...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!allowed) {
    return <Navigate replace to="/admin/login" />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<RoleSelectionPage />} path="/select-role" />
      <Route element={<PublicRoute><LandingPage /></PublicRoute>} path="/" />
      <Route element={<PublicRoute><PlansPage /></PublicRoute>} path="/plans" />
      <Route element={<PublicRoute><TurfPage /></PublicRoute>} path="/turf" />
      <Route element={<PublicRoute><TrainersPage /></PublicRoute>} path="/trainers" />
      <Route element={<PublicRoute><FeedbackPage /></PublicRoute>} path="/feedback" />
      <Route element={<LoginPage />} path="/admin/login" />
      <Route element={<Navigate replace to="/admin/dashboard" />} path="/admin" />
      <Route element={<ProtectedAdminRoute><AdminShell><DashboardPage /></AdminShell></ProtectedAdminRoute>} path="/admin/dashboard" />
      <Route element={<ProtectedAdminRoute><AdminShell><MembersPage /></AdminShell></ProtectedAdminRoute>} path="/admin/members" />
      <Route element={<ProtectedAdminRoute><AdminShell><PaymentsPage /></AdminShell></ProtectedAdminRoute>} path="/admin/payments" />
      <Route element={<ProtectedAdminRoute><AdminShell><TurfManagementPage /></AdminShell></ProtectedAdminRoute>} path="/admin/turf" />
      <Route element={<ProtectedAdminRoute><AdminShell><BookingsPage /></AdminShell></ProtectedAdminRoute>} path="/admin/bookings" />
      <Route element={<ProtectedAdminRoute><AdminShell><AdminFeedbackPage /></AdminShell></ProtectedAdminRoute>} path="/admin/feedback" />
      <Route element={<ProtectedAdminRoute><AdminShell><PartnersPage /></AdminShell></ProtectedAdminRoute>} path="/admin/partners" />
      <Route element={<ProtectedAdminRoute><AdminShell><ProfilePage /></AdminShell></ProtectedAdminRoute>} path="/admin/profile" />
      <Route element={<Navigate replace to="/select-role" />} path="*" />
    </Routes>
  )
}
