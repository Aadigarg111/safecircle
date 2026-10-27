import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, LogOut, Moon, Sun, Globe, Shield, BarChart2, ChevronRight, Plus, X, UserCheck } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { showToast } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import type { EmergencyContact } from '@/types'

const AVATARS = ['👤', '👩', '👨', '👧', '👦', '👴', '👵', '🧑', '👩‍💼', '👨‍💼', '👩‍⚕️', '👨‍⚕️']

export default function ProfilePage() {
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const language = useStore(s => s.language)
  const setLanguage = useStore(s => s.setLanguage)
  const isElderMode = useStore(s => s.isElderMode)
  const setElderMode = useStore(s => s.setElderMode)
  const privacySettings = useStore(s => s.privacySettings)
  const setPrivacySettings = useStore(s => s.setPrivacySettings)
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState<Omit<EmergencyContact, 'id'>>({ name: '', phone: '', relation: '' })

  const handleSaveProfile = async () => {
    if (!user) return
    try {
      const updated = await dataService.updateProfile({ ...user, name: form.name, phone: form.phone })
      setUser(updated)
      setEditing(false)
      showToast({ type: 'success', title: 'Profile updated' })
    } catch (e) {
      showToast({ type: 'error', title: 'Update failed', message: String(e) })
    }
  }

  const handleSetAvatar = async (avatar: string) => {
    if (!user) return
    const updated = await dataService.updateProfile({ ...user, avatar })
    setUser(updated)
  }

  const handleLogout = async () => {
    await dataService.signOut()
    setUser(null)
    navigate('/login', { replace: true })
  }

  const handleAddContact = async () => {
    if (!user || !newContact.name || !newContact.phone) return
    const contact: EmergencyContact = { ...newContact, id: crypto.randomUUID() }
    const updated = await dataService.updateProfile({
      ...user,
      emergencyContacts: [...user.emergencyContacts, contact],
    })
    setUser(updated)
    setAddingContact(false)
    setNewContact({ name: '', phone: '', relation: '' })
    showToast({ type: 'success', title: 'Contact added' })
  }

  const handleRemoveContact = async (id: string) => {
    if (!user) return
    const updated = await dataService.updateProfile({
      ...user,
      emergencyContacts: user.emergencyContacts.filter(c => c.id !== id),
    })
    setUser(updated)
  }

  const togglePause = async () => {
    if (!user) return
    const updated = { ...privacySettings, isPaused: !privacySettings.isPaused }
    await dataService.updatePrivacySettings(user.id, updated)
    setPrivacySettings(updated)
    showToast({ type: 'info', title: updated.isPaused ? 'Location sharing paused' : 'Location sharing resumed' })
  }

  const toggleGhost = async () => {
    if (!user) return
    const updated = { ...privacySettings, isGhostMode: !privacySettings.isGhostMode }
    await dataService.updatePrivacySettings(user.id, updated)
    setPrivacySettings(updated)
    showToast({ type: 'info', title: updated.isGhostMode ? 'Ghost mode ON' : 'Ghost mode OFF' })
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Profile" />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile card */}
        <div className="card mx-4 mt-4 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEditing(true)}
              className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-4xl relative"
            >
              {user.avatar}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <Edit2 size={10} className="text-white" />
              </span>
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">{user.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.phone}</p>
            </div>
            <button onClick={() => setEditing(true)} className="btn-ghost p-2">
              <Edit2 size={16} />
            </button>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="mx-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Emergency Contacts</h3>
            <button onClick={() => setAddingContact(true)} className="btn-ghost p-1.5 text-red-500">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-2">
            {user.emergencyContacts.map(c => (
              <div key={c.id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <UserCheck size={16} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone} · {c.relation}</p>
                </div>
                <a href={`tel:${c.phone}`} className="btn-ghost p-2 text-green-500">
                  <Shield size={16} />
                </a>
                <button onClick={() => handleRemoveContact(c.id)} className="btn-ghost p-2 text-red-400">
                  <X size={16} />
                </button>
              </div>
            ))}
            {user.emergencyContacts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-3">No emergency contacts added</p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="mx-4 mt-4 space-y-2">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Settings</h3>

          {/* Theme */}
          <button onClick={toggleTheme} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={18} className="text-purple-400" /> : <Sun size={18} className="text-yellow-400" />}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
            </div>
          </button>

          {/* Language */}
          <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'en' ? '🇺🇸 English' : '🇮🇳 हिन्दी'}
            </span>
          </button>

          {/* Pause sharing */}
          <button onClick={togglePause} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-green-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pause Location Sharing</p>
                <p className="text-xs text-slate-400">Others won't see your location</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${privacySettings.isPaused ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${privacySettings.isPaused ? 'translate-x-5' : ''}`} />
            </div>
          </button>

          {/* Ghost mode */}
          <button onClick={toggleGhost} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-slate-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ghost Mode</p>
                <p className="text-xs text-slate-400">Completely invisible to all members</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${privacySettings.isGhostMode ? 'bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${privacySettings.isGhostMode ? 'translate-x-5' : ''}`} />
            </div>
          </button>

          {/* Elder mode */}
          <button onClick={() => setElderMode(!isElderMode)} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <UserCheck size={18} className="text-orange-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Elder Mode</p>
                <p className="text-xs text-slate-400">Simplified UI + fall detection</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${isElderMode ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${isElderMode ? 'translate-x-5' : ''}`} />
            </div>
          </button>

          {/* Admin dashboard link */}
          <button onClick={() => navigate('/admin')} className="card p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <BarChart2 size={18} className="text-indigo-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Dashboard</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* Logout */}
          <button onClick={handleLogout} className="card p-4 flex items-center gap-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Edit profile modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => handleSetAvatar(a)}
                className={`text-2xl p-2 rounded-xl transition-all ${user.avatar === a ? 'bg-red-100 dark:bg-red-900/30 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input"
            placeholder="Your name"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="input"
            placeholder="Phone number"
          />
          <button onClick={handleSaveProfile} className="btn-primary w-full py-3">Save Changes</button>
        </div>
      </Modal>

      {/* Add contact modal */}
      <Modal isOpen={addingContact} onClose={() => setAddingContact(false)} title="Add Emergency Contact">
        <div className="p-5 space-y-3">
          <input type="text" value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} className="input" placeholder="Contact name" />
          <input type="tel" value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} className="input" placeholder="Phone number" />
          <input type="text" value={newContact.relation} onChange={e => setNewContact(c => ({ ...c, relation: e.target.value }))} className="input" placeholder="Relation (e.g. Mother, Friend)" />
          <button onClick={handleAddContact} className="btn-primary w-full py-3">Add Contact</button>
        </div>
      </Modal>
    </div>
  )
}
