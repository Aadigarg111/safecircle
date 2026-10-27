import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import PageHeader from '@/components/ui/PageHeader'
import MapView from '@/components/map/MapView'
import { Calendar, Users } from 'lucide-react'
import type { LocationPoint } from '@/types'

export default function HistoryPage() {
  const user = useStore(s => s.user)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedUserId, setSelectedUserId] = useState(user?.id ?? '')
  const [historyPoints, setHistoryPoints] = useState<LocationPoint[]>([])

  const users = (() => {
    try {
      return JSON.parse(localStorage.getItem('sc_users') ?? '[]') as Array<{ id: string; name: string; avatar: string }>
    } catch { return [] }
  })()

  useEffect(() => {
    if (!selectedUserId) return
    dataService.getLocationHistory(selectedUserId, selectedDate).then(setHistoryPoints)
  }, [selectedUserId, selectedDate])

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Location History" />

      {/* Controls */}
      <div className="flex gap-2 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Calendar size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
            className="input flex-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Users size={16} className="text-slate-400 flex-shrink-0" />
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="input flex-1 text-sm"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.avatar} {u.name.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {historyPoints.length > 0 && (
        <div className="flex gap-3 px-4 pb-3 flex-shrink-0">
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{historyPoints.length}</p>
            <p className="text-xs text-slate-500">Points</p>
          </div>
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {new Date(historyPoints[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500">Start</p>
          </div>
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold text-green-500">
              {new Date(historyPoints[historyPoints.length - 1]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500">End</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {historyPoints.length > 0 ? (
          <MapView
            showHistory
            historyUserId={selectedUserId}
            routePolyline={historyPoints.map(p => [p.lat, p.lng] as [number, number])}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Calendar size={48} className="opacity-40" />
            <p className="font-medium">No history for this date</p>
            <p className="text-sm">Try selecting a different date or member</p>
          </div>
        )}
      </div>
    </div>
  )
}
