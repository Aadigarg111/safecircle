import { useState, useRef } from 'react'
import { Navigation, X, Search, Clock } from 'lucide-react'
import { dataService } from '@/services'
import { useStore } from '@/store'
import { useGeolocation } from '@/hooks/useGeolocation'
import { searchAddress, fetchRoute } from '@/services/overpass'
import { showToast } from '@/components/ui/Toast'
import type { Trip } from '@/types'

interface SafeJourneyPanelProps {
  circleId: string
  onClose: () => void
}

export default function SafeJourneyPanel({ circleId, onClose }: SafeJourneyPanelProps) {
  const [destination, setDestination] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const [selected, setSelected] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [etaOverride, setEtaOverride] = useState(30)
  const [loading, setLoading] = useState(false)
  const [activeTrip, setActiveTripLocal] = useState<Trip | null>(null)
  const setActiveTrip = useStore(s => s.setActiveTrip)
  const { location } = useGeolocation()
  const user = useStore(s => s.user)

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (q: string) => {
    setDestination(q)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (q.length < 3) { setSuggestions([]); return }
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchAddress(q)
      setSuggestions(results)
    }, 500)
  }

  const handleStartJourney = async () => {
    if (!selected || !user) return
    setLoading(true)
    try {
      const startLoc = location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
      const route = await fetchRoute(startLoc.lat, startLoc.lng, selected.lat, selected.lng).catch(() => null)
      const calculatedEta = route?.durationMinutes ?? etaOverride
      const eta = new Date(Date.now() + calculatedEta * 60000).toISOString()

      const trip = await dataService.startTrip({
        userId: user.id,
        circleId,
        destination: selected.name,
        destinationLocation: { lat: selected.lat, lng: selected.lng, timestamp: new Date().toISOString() },
        startLocation: startLoc,
        eta,
        etaMinutes: calculatedEta,
        routePolyline: route?.polyline.map(([lat, lng]) => ({ lat, lng, timestamp: new Date().toISOString() })) ?? undefined,
      })
      setActiveTripLocal(trip)
      setActiveTrip(trip)
      showToast({ type: 'success', title: '🚶 Safe Journey started!', message: `ETA: ${calculatedEta} min to ${selected.name.split(',')[0]}` })
    } catch (e) {
      showToast({ type: 'error', title: 'Failed to start journey', message: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const handleEndJourney = async () => {
    if (!activeTrip) return
    await dataService.updateTripStatus(activeTrip.id, 'completed')
    setActiveTripLocal(null)
    setActiveTrip(null)
    showToast({ type: 'success', title: '✅ Journey completed!', message: 'Your circle has been notified' })
    onClose()
  }

  const handleReachedSafely = async () => {
    await handleEndJourney()
    const msg = encodeURIComponent(`✅ I reached safely! Location: ${selected?.name ?? 'destination'}`)
    if (navigator.share) {
      navigator.share({ text: msg }).catch(() => {})
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[500] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-blue-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Safe Journey</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {!activeTrip ? (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={destination}
                onChange={e => handleSearch(e.target.value)}
                className="input pl-9"
                placeholder="Search destination..."
              />
            </div>

            {suggestions.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelected(s); setDestination(s.name.split(',')[0]); setSuggestions([]) }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <div className="font-medium truncate">{s.name.split(',')[0]}</div>
                    <div className="text-xs text-slate-400 truncate">{s.name.split(',').slice(1, 3).join(',')}</div>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">📍 {selected.name.split(',')[0]}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400 flex-shrink-0" />
              <label className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">ETA (min):</label>
              <input
                type="number"
                value={etaOverride}
                onChange={e => setEtaOverride(parseInt(e.target.value) || 30)}
                className="input flex-1"
                min={1}
                max={480}
              />
            </div>

            <button
              onClick={handleStartJourney}
              disabled={!selected || loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation size={16} />
              )}
              Start Safe Journey
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="font-semibold text-green-700 dark:text-green-400">Journey Active</p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 truncate">📍 {activeTrip.destination.split(',')[0]}</p>
              <p className="text-xs text-slate-500 mt-1">
                ETA: {new Date(activeTrip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                ({activeTrip.etaMinutes} min)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Your circle is watching your journey 👁</p>
            </div>
            <button onClick={handleReachedSafely} className="btn-primary w-full py-3">
              ✅ I Reached Safely
            </button>
            <button onClick={handleEndJourney} className="btn-secondary w-full py-2 text-sm">
              Cancel Journey
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
