import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { dataService } from '@/services'
import { useStore } from '@/store'
import { showToast } from '@/components/ui/Toast'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const setUser = useStore(s => s.setUser)
  const navigate = useNavigate()

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      showToast({ type: 'error', title: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      const user = await dataService.signUp(form.email, form.password, form.name, form.phone)
      setUser(user)
      navigate('/map', { replace: true })
    } catch (err) {
      showToast({ type: 'error', title: 'Signup failed', message: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={18} /> Back to login
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create account</h1>
              <p className="text-slate-400 text-sm">Join your family circle</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleSignup} className="space-y-4">
              {[
                { label: 'Full Name', field: 'name', type: 'text', placeholder: 'Priya Sharma' },
                { label: 'Email', field: 'email', type: 'email', placeholder: 'priya@example.com' },
                { label: 'Phone', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Confirm Password', field: 'confirmPassword', type: 'password', placeholder: '••••••••' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, string>)[field]}
                    onChange={handleChange(field)}
                    className="input"
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}

              <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-red-500 font-semibold hover:text-red-600">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
