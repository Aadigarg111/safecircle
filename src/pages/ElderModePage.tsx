import { useState, useEffect } from 'react'
import { Phone, CheckCircle, MapPin, Battery } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useBattery } from '@/hooks/useBattery'
import { showToast } from '@/components/ui/Toast'
import type { MemberLocation } from '@/types'

// Fall detection threshold
const FALL_THRESHOLD = 25 // m/s²

export default function ElderModePage() {
  const user = useStore(s => s.user)
  const activeCircleId = useStore(s => s.activeCircleId)
  const setActiveSOS = useStore(s => s.setActiveSOS)
  const setElderMode = useStore(s => s.setElderMode)
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([])
  const [okCheckedIn, setOkCheckedIn] = useState(false)
  const [fallDetected, setFallDetected] = useState(false)
  const { location } = useGeolocation()
  const battery = useBattery()

  // Load member locations
  useEffect(() => {
    if (!activeCircleId) return
    dataService.getMemberLocations(activeCircleId).then(setMemberLocations)
  }, [activeCircleId])

  // Publish own location
  useEffect(() => {
    if (!location || !activeCircleId || !user) return
    dataService.publishLocation(activeCircleId, location, battery.level, battery.charging)
  }, [location, activeCircleId, user, battery.level, battery.charging])

  // Fall detection via DeviceMotion
  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity
      if (!accel) return
      const { x = 0, y = 0, z = 0 } = accel
      const magnitude = Math.sqrt((x ?? 0) ** 2 + (y ?? 0) ** 2 + (z ?? 0) ** 2)
      if (magnitude > FALL_THRESHOLD) {
        setFallDetected(true)
        navigator.vibrate?.([500, 200, 500])
        showToast({ type: 'error', title: '⚠️ Fall detected!', message: 'Press Cancel if you\'re OK' })
      }
    }
    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [])

  // Auto-SOS on confirmed fall
  useEffect(() => {
    if (!fallDetected) return
    const timer = setTimeout(async () => {
      const loc = location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
      if (activeCircleId) {
        const sos = await dataService.triggerSOS(activeCircleId, loc, 'button')
        setActiveSOS(sos)
        showToast({ type: 'error', title: '🆘 SOS triggered due to fall!' })
      }
    }, 10000) // 10 second window to cancel
    return () => clearTimeout(timer)
  }, [fallDetected, location, activeCircleId, setActiveSOS])

  // Daily I'm OK prompt at 8am and 8pm
  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours()
      if ((hour === 8 || hour === 20) && !okCheckedIn) {
        showToast({ type: 'info', title: 'Daily check-in', message: 'Please tap "I\'m OK" to let your family know you\'re safe', duration: 30000 })
      }
    }
    const interval = setInterval(check, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [okCheckedIn])

  const handleOK = async () => {
    if (!activeCircleId || !user) return
    await dataService.sendMessage(activeCircleId, "I'm OK today! 😊")
    setOkCheckedIn(true)
    showToast({ type: 'success', title: '✅ Family notified — have a great day!' })
  }

  const handleSOS = async () => {
    const loc = location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
    if (activeCircleId) {
      const sos = await dataService.triggerSOS(activeCircleId, loc, 'button')
      setActiveSOS(sos)
    }
  }

  const users = (() => {
    try {
      return JSON.parse(localStorage.getItem('sc_users') ?? '[]') as Array<{ id: string; name: string; avatar: string }>
    } catch { return [] }
  })()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col px-5 py-8 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{user?.avatar} Hello!</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{user?.name?.split(' ')[0]}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Battery size={16} className={battery.level < 20 ? 'text-red-500' : 'text-green-500'} />
            <span className={battery.level < 20 ? 'text-red-500 font-bold' : 'text-slate-500'}>{battery.level}%</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
              <MapPin size={12} /> Location active
            </div>
          )}
        </div>
      </div>

      {/* Fall detected alert */}
      {fallDetected && (
        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-3xl p-5">
          <p className="text-xl font-bold text-red-600 dark:text-red-400 text-center">⚠️ Fall Detected!</p>
          <p className="text-center text-red-500 mt-1">SOS will trigger in 10 seconds</p>
          <button
            onClick={() => setFallDetected(false)}
            className="mt-3 w-full py-3 bg-white dark:bg-slate-800 rounded-2xl font-bold text-red-500 text-lg"
          >
            I'm OK — Cancel
          </button>
        </div>
      )}

      {/* SOS Button - big */}
      <button
        onPointerDown={handleSOS}
        className="w-full py-10 bg-red-500 text-white rounded-3xl font-black text-4xl shadow-2xl shadow-red-500/40 sos-pulse active:scale-95 transition-transform"
      >
        🆘 HELP
      </button>

      {/* I'm OK */}
      <button
        onClick={handleOK}
        className={`w-full py-6 rounded-3xl font-bold text-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
          okCheckedIn
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            : 'bg-green-500 text-white shadow-green-500/30'
        }`}
      >
        <CheckCircle size={32} />
        {okCheckedIn ? 'Checked In ✓' : "I'm OK Today"}
      </button>

      {/* Quick call */}
      <div className="space-y-3">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Quick Call</p>
        {user?.emergencyContacts?.slice(0, 2).map(c => (
          <a
            key={c.id}
            href={`tel:${c.phone}`}
            className="card p-4 flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <Phone size={28} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-slate-800 dark:text-white">{c.name}</p>
              <p className="text-slate-500">{c.relation}</p>
            </div>
          </a>
        ))}
        <a href="tel:112" className="card p-4 flex items-center gap-4 active:scale-95 transition-transform">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
            <Phone size={28} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">Emergency: 112</p>
            <p className="text-slate-500">Police / Ambulance / Fire</p>
          </div>
        </a>
      </div>

      {/* Family status */}
      <div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Family</p>
        <div className="space-y-3">
          {memberLocations.filter(l => l.userId !== user?.id).slice(0, 4).map(ml => {
            const ud = users.find(u => u.id === ml.userId) ?? { name: 'Member', avatar: '👤' }
            return (
              <div key={ml.userId} className="card p-4 flex items-center gap-4">
                <div className="text-4xl">{ud.avatar}</div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{ud.name.split(' ')[0]}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${ml.status === 'safe' ? 'bg-green-500' : ml.status === 'sos' ? 'bg-red-500' : 'bg-slate-400'}`} />
                    <span className="text-slate-500 capitalize">{ml.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Exit elder mode */}
      <button onClick={() => setElderMode(false)} className="text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
        Switch to Standard Mode
      </button>
    </div>
  )
}
