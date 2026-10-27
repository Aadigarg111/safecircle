import { useState, useEffect } from 'react'
import { Users, Plus, UserPlus, Copy, QrCode, Battery, Clock, Share2, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { showToast } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import type { Membership, MemberLocation } from '@/types'
import clsx from 'clsx'
import { QRCodeSVG } from 'qrcode.react'

const STATUS_COLORS: Record<string, string> = {
  safe: 'badge-safe',
  sos: 'badge-sos',
  outside_zone: 'badge-warning',
  offline: 'badge-offline',
  ghost: 'badge-offline',
}

export default function CirclePage() {
  const user = useStore(s => s.user)
  const circles = useStore(s => s.circles)
  const setCircles = useStore(s => s.setCircles)
  const activeCircleId = useStore(s => s.activeCircleId)
  const setActiveCircleId = useStore(s => s.setActiveCircleId)
  const memberLocations = useStore(s => s.memberLocations)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [newCircleName, setNewCircleName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const activeCircle = circles.find(c => c.id === activeCircleId)

  // Load members when circle changes
  useEffect(() => {
    if (!activeCircleId) return
    dataService.getCircleMembers(activeCircleId).then(setMemberships)
  }, [activeCircleId])

  const getLocationForMember = (userId: string): MemberLocation | undefined =>
    memberLocations.find(l => l.userId === userId && l.circleId === activeCircleId)

  const getUserData = (userId: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('sc_users') ?? '[]') as Array<{ id: string; name: string; avatar: string }>
      return users.find(u => u.id === userId) ?? { name: userId, avatar: '👤' }
    } catch { return { name: userId, avatar: '👤' } }
  }

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return
    setLoading(true)
    try {
      const circle = await dataService.createCircle(newCircleName)
      setCircles([...circles, circle])
      setActiveCircleId(circle.id)
      setShowCreate(false)
      setNewCircleName('')
      showToast({ type: 'success', title: `Circle "${circle.name}" created!`, message: `Invite code: ${circle.inviteCode}` })
    } catch (e) {
      showToast({ type: 'error', title: 'Failed to create circle', message: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCircle = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      const circle = await dataService.joinCircle(inviteCode.toUpperCase())
      if (!circles.find(c => c.id === circle.id)) {
        setCircles([...circles, circle])
      }
      setActiveCircleId(circle.id)
      setShowJoin(false)
      setInviteCode('')
      showToast({ type: 'success', title: `Joined "${circle.name}"!` })
    } catch (e) {
      showToast({ type: 'error', title: 'Failed to join circle', message: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (activeCircle) {
      navigator.clipboard.writeText(activeCircle.inviteCode).then(() => {
        showToast({ type: 'success', title: 'Invite code copied!' })
      })
    }
  }

  const handleShareLink = () => {
    const url = `${window.location.origin}?join=${activeCircle?.inviteCode}`
    if (navigator.share) {
      navigator.share({ title: 'Join my SafeCircle', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast({ type: 'success', title: 'Link copied!', message: url })
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader
        title={activeCircle?.name ?? 'My Circle'}
        subtitle={`${memberships.length} members`}
        right={
          <div className="flex gap-1">
            <button onClick={() => setShowCreate(true)} className="btn-ghost p-2" title="Create circle">
              <Plus size={18} />
            </button>
            <button onClick={() => setShowJoin(true)} className="btn-ghost p-2" title="Join circle">
              <UserPlus size={18} />
            </button>
          </div>
        }
      />

      {/* Circle selector */}
      {circles.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {circles.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCircleId(c.id)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                c.id === activeCircleId
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {circles.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No circles yet"
            description="Create a circle or join one with an invite code"
            action={
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(true)} className="btn-primary">Create Circle</button>
                <button onClick={() => setShowJoin(true)} className="btn-secondary">Join Circle</button>
              </div>
            }
          />
        ) : (
          <>
            {/* Invite section */}
            {activeCircle && (
              <div className="card p-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Invite Members</h3>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 mb-3">
                  <span className="flex-1 font-mono text-2xl font-bold text-red-500 tracking-widest text-center">
                    {activeCircle.inviteCode}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyCode} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Copy size={14} /> Copy Code
                  </button>
                  <button onClick={() => setShowQR(true)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <QrCode size={14} /> QR Code
                  </button>
                  <button onClick={handleShareLink} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>
            )}

            {/* Member list */}
            <div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Members</h3>
              <div className="space-y-2">
                {memberships.map(m => {
                  const userData = getUserData(m.userId)
                  const loc = getLocationForMember(m.userId)
                  const isCurrentUser = m.userId === user?.id

                  return (
                    <div key={m.userId} className="card p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl relative">
                        {userData.avatar}
                        {isCurrentUser && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {userData.name} {isCurrentUser && '(you)'}
                          </p>
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full capitalize">
                            {m.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {loc && (
                            <>
                              <span className={STATUS_COLORS[loc.status] ?? 'badge-offline'}>
                                {loc.status.replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Battery size={11} />
                                {loc.batteryLevel}%
                                {loc.batteryCharging && ' ⚡'}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} />
                                {formatDistanceToNow(new Date(loc.lastSeen), { addSuffix: true })}
                              </span>
                            </>
                          )}
                          {!loc && <span className="badge-offline">Offline</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Geofence section */}
            <GeofencePanel circleId={activeCircleId} />
          </>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Circle">
        <div className="p-5 space-y-4">
          <input
            type="text"
            value={newCircleName}
            onChange={e => setNewCircleName(e.target.value)}
            className="input"
            placeholder="Circle name (e.g. Sharma Family)"
            autoFocus
          />
          <button onClick={handleCreateCircle} className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Creating...' : 'Create Circle'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join Circle">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter the 6-character invite code shared by your circle admin.</p>
          <input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            className="input text-center text-2xl font-mono tracking-widest uppercase"
            placeholder="SAFE24"
            maxLength={8}
            autoFocus
          />
          <p className="text-xs text-center text-slate-400">Demo code: <strong className="text-red-500">SAFE2024</strong></p>
          <button onClick={handleJoinCircle} className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Joining...' : 'Join Circle'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="QR Code Invite">
        <div className="p-6 flex flex-col items-center gap-4">
          <QRCodeSVG
            value={`safecircle://join/${activeCircle?.inviteCode}`}
            size={200}
            level="H"
            includeMargin
          />
          <p className="text-sm text-slate-500">Scan to join {activeCircle?.name}</p>
          <p className="font-mono text-xl font-bold text-red-500">{activeCircle?.inviteCode}</p>
        </div>
      </Modal>
    </div>
  )
}

// Geofence management panel embedded in circle page
function GeofencePanel({ circleId }: { circleId: string | null }) {
  const geofences = useStore(s => s.geofences)
  const addGeofence = useStore(s => s.addGeofence)
  const removeGeofence = useStore(s => s.removeGeofence)
  const user = useStore(s => s.user)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: 'Home', shape: 'circle' as 'circle' | 'polygon', lat: '28.6139', lng: '77.2090', radius: '300', color: '#22c55e' })

  const handleAdd = async () => {
    if (!circleId || !user) return
    const gf = await dataService.createGeofence({
      circleId,
      name: form.name,
      shape: form.shape,
      center: form.shape === 'circle' ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } : undefined,
      radius: form.shape === 'circle' ? parseFloat(form.radius) : undefined,
      coordinates: form.shape === 'polygon' ? [
        { lat: parseFloat(form.lat) + 0.002, lng: parseFloat(form.lng) - 0.002 },
        { lat: parseFloat(form.lat) + 0.002, lng: parseFloat(form.lng) + 0.002 },
        { lat: parseFloat(form.lat) - 0.002, lng: parseFloat(form.lng) + 0.002 },
        { lat: parseFloat(form.lat) - 0.002, lng: parseFloat(form.lng) - 0.002 },
      ] : undefined,
      color: form.color,
      createdBy: user.id,
    })
    addGeofence(gf)
    setShowAdd(false)
    showToast({ type: 'success', title: `Safe zone "${gf.name}" added` })
  }

  const handleDelete = async (id: string) => {
    await dataService.deleteGeofence(id)
    removeGeofence(id)
    showToast({ type: 'info', title: 'Safe zone removed' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Safe Zones</h3>
        <button onClick={() => setShowAdd(true)} className="btn-ghost p-1.5 text-red-500">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {geofences.filter(g => g.circleId === circleId).map(gf => (
          <div key={gf.id} className="card p-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: gf.color }}
            >
              {gf.shape === 'circle' ? '⭕' : '⬡'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{gf.name}</p>
              <p className="text-xs text-slate-500">
                {gf.shape === 'circle' ? `${gf.radius}m radius` : 'Polygon zone'}
              </p>
            </div>
            <button onClick={() => handleDelete(gf.id)} className="btn-ghost p-2 text-red-400">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {geofences.filter(g => g.circleId === circleId).length === 0 && (
          <p className="text-sm text-slate-400 text-center py-3">No safe zones yet</p>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Safe Zone">
        <div className="p-5 space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input"
            placeholder="Zone name (Home, School...)"
          />
          <div className="flex gap-2">
            {(['circle', 'polygon'] as const).map(s => (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, shape: s }))}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
                  form.shape === s ? 'bg-red-500 text-white' : 'btn-secondary',
                )}
              >
                {s === 'circle' ? '⭕ Circle' : '⬡ Polygon'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} className="input" placeholder="Latitude" step="0.0001" />
            <input type="number" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} className="input" placeholder="Longitude" step="0.0001" />
          </div>
          {form.shape === 'circle' && (
            <input type="number" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: e.target.value }))} className="input" placeholder="Radius (meters)" />
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Color:</label>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full py-3">Add Safe Zone</button>
        </div>
      </Modal>
    </div>
  )
}
