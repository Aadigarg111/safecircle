import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/store'
import { dataService } from '@/services'
import BottomNav from '@/components/ui/BottomNav'
import FloatingSOS from '@/components/sos/FloatingSOS'
import SOSModal from '@/components/sos/SOSModal'
import FakeCallScreen from '@/components/safety/FakeCallScreen'
import Toast from '@/components/ui/Toast'
import NightCheckinPrompt from '@/components/safety/NightCheckinPrompt'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Lazy load pages
const MapPage = lazy(() => import('@/pages/MapPage'))
const CirclePage = lazy(() => import('@/pages/CirclePage'))
const SOSPage = lazy(() => import('@/pages/SOSPage'))
const AlertsPage = lazy(() => import('@/pages/AlertsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const HistoryPage = lazy(() => import('@/pages/HistoryPage'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const ElderModePage = lazy(() => import('@/pages/ElderModePage'))
const ChatPage = lazy(() => import('@/pages/ChatPage'))

export default function App() {
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const theme = useStore(s => s.theme)
  const showSOSModal = useStore(s => s.showSOSModal)
  const showFakeCall = useStore(s => s.showFakeCall)
  const fakeCallName = useStore(s => s.fakeCallName)
  const isElderMode = useStore(s => s.isElderMode)

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Restore session
  useEffect(() => {
    dataService.getCurrentUser().then(u => {
      if (u) setUser(u)
    })
  }, [setUser])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  if (isElderMode) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ElderModePage />
        {showFakeCall && <FakeCallScreen callerName={fakeCallName} />}
        {showSOSModal && <SOSModal />}
        <Toast />
      </Suspense>
    )
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full max-w-md mx-auto relative overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-2xl">
      {showFakeCall && <FakeCallScreen callerName={fakeCallName} />}
      {showSOSModal && <SOSModal />}
      <NightCheckinPrompt />
      <Toast />

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/circle" element={<CirclePage />} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />
      <FloatingSOS />
    </div>
  )
}
