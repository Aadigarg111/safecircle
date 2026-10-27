import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { dataService } from '@/services'
import { useStore } from '@/store'
import { showToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const [email, setEmail] = useState('priya@demo.com')
  const [password, setPassword] = useState('demo1234')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const setUser = useStore(s => s.setUser)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await dataService.signIn(email, password)
      setUser(user)
      navigate('/map', { replace: true })
    } catch (err) {
      showToast({ type: 'error', title: 'Login failed', message: String(err) })
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (demoEmail: string) => {
    setLoading(true)
    try {
      const user = await dataService.signIn(demoEmail, 'demo')
      setUser(user)
      navigate('/map', { replace: true })
    } catch (err) {
      showToast({ type: 'error', title: 'Login failed', message: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-red-500/30">
          <Shield size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">SafeCircle</h1>
        <p className="text-slate-400 text-sm mb-8">Family Safety Platform</p>

        {/* Login Card */}
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5">Welcome back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">Quick demo login as:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Priya (Admin)', email: 'priya@demo.com', emoji: '👩' },
                { name: 'Rahul', email: 'rahul@demo.com', emoji: '👨' },
                { name: 'Anita (Elder)', email: 'anita@demo.com', emoji: '👴' },
                { name: 'Rohan (Child)', email: 'rohan@demo.com', emoji: '👦' },
              ].map(demo => (
                <button
                  key={demo.email}
                  onClick={() => quickLogin(demo.email)}
                  className="btn-secondary text-xs py-2 flex items-center gap-1.5"
                  disabled={loading}
                >
                  <span>{demo.emoji}</span>
                  <span className="truncate">{demo.name}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-500 font-semibold hover:text-red-600">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
