import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import MapView from '@/components/map/MapView'
import SafeJourneyPanel from '@/components/safety/SafeJourneyPanel'
import { Navigation, Flame, History, Layers } from 'lucide-react'
import clsx from 'clsx'

type MapMode = 'normal' | 'journey' | 'heatmap' | 'history'

export default function MapPage() {
  const user = useStore(s => s.user)
  const activeCircleId = useStore(s => s.activeCircleId)
  const circles = useStore(s => s.circles)
  const setCircles = useStore(s => s.setCircles)
  const setActiveCircleId = useStore(s => s.setActiveCircleId)
  const setGeofences = useStore(s => s.setGeofences)
  const setAlerts = useStore(s => s.setAlerts)
  const addAlert = useStore(s => s.addAlert)
  const [mapMode, setMapMode] = useState<MapMode>('normal')

  // Load circles and auto-select first
  useEffect(() => {
    if (!user) return
    dataService.getMyCircles().then(cs => {
      setCircles(cs)
      if (cs.length > 0 && !activeCircleId) {
        setActiveCircleId(cs[0].id)
      }
    })
  }, [user, setCircles, setActiveCircleId, activeCircleId])

  // Load geofences when circle changes
  useEffect(() => {
    if (!activeCircleId) return
    dataService.getGeofences(activeCircleId).then(setGeofences)
  }, [activeCircleId, setGeofences])

  // Load alerts and subscribe
  useEffect(() => {
    if (!activeCircleId) return
    dataService.getAlerts(activeCircleId).then(setAlerts)
    const unsub = dataService.subscribeToAlerts(activeCircleId, alert => {
      addAlert(alert)
      if (alert.severity === 'critical') {
        navigator.vibrate?.([200, 100, 200])
        if (Notification.permission === 'granted') {
          new Notification(`SafeCircle: ${alert.message}`, { icon: '/favicon.svg' })
        }
      }
    })
    return unsub
  }, [activeCircleId, setAlerts, addAlert])

  const modeButtons = [
    { mode: 'journey' as MapMode, icon: Navigation, label: 'Journey', color: 'text-blue-500' },
    { mode: 'heatmap' as MapMode, icon: Flame, label: 'Heatmap', color: 'text-orange-500' },
    { mode: 'history' as MapMode, icon: History, label: 'History', color: 'text-purple-500' },
  ]

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Circle selector */}
      {circles.length > 1 && (
        <div className="absolute top-3 left-3 z-[400]">
          <select
            value={activeCircleId ?? ''}
            onChange={e => setActiveCircleId(e.target.value)}
            className="bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200
                       border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {circles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          showHeatmap={mapMode === 'heatmap'}
          showHistory={mapMode === 'history'}
          historyUserId={user?.id}
        />
      </div>

      {/* Safe Journey Panel */}
      {mapMode === 'journey' && activeCircleId && (
        <SafeJourneyPanel circleId={activeCircleId} onClose={() => setMapMode('normal')} />
      )}

      {/* Bottom mode buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 px-3 py-2">
          {modeButtons.map(({ mode, icon: Icon, label, color }) => (
            <button
              key={mode}
              onClick={() => setMapMode(mapMode === mode ? 'normal' : mode)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                mapMode === mode
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700',
              )}
            >
              <Icon size={16} className={mapMode === mode ? color : ''} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
