import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { dataService } from '@/services'
import { useStore } from '@/store'
import { useGeolocation } from '@/hooks/useGeolocation'
import { showToast } from '@/components/ui/Toast'
import type { IncidentCategory } from '@/types'

interface ReportIncidentProps {
  onClose: () => void
}

const CATEGORIES: { value: IncidentCategory; label: string; emoji: string }[] = [
  { value: 'poor_lighting', label: 'Poor Lighting', emoji: '🔦' },
  { value: 'harassment', label: 'Harassment', emoji: '⚠️' },
  { value: 'isolated_area', label: 'Isolated Area', emoji: '🏚' },
  { value: 'unsafe_road', label: 'Unsafe Road', emoji: '🚧' },
  { value: 'other', label: 'Other', emoji: '❗' },
]

export default function ReportIncident({ onClose }: ReportIncidentProps) {
  const [category, setCategory] = useState<IncidentCategory>('poor_lighting')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { location } = useGeolocation()
  const user = useStore(s => s.user)

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await dataService.reportIncident({
        userId: user.id,
        location: location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() },
        category,
        description,
      })
      showToast({ type: 'success', title: '📍 Incident reported!', message: 'Thank you for keeping the community safe' })
      onClose()
    } catch (e) {
      showToast({ type: 'error', title: 'Report failed', message: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
        <MapPin size={16} className="text-red-500" />
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Reporting at your current location</p>
          {location && (
            <p className="text-xs text-slate-400">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Category</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input resize-none h-24"
          placeholder="Describe what you observed..."
        />
      </div>

      <button onClick={handleSubmit} className="btn-primary w-full py-3" disabled={loading}>
        {loading ? 'Submitting...' : '📍 Report Incident'}
      </button>
    </div>
  )
}
