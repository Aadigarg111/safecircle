import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, TrendingUp, Shield } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import PageHeader from '@/components/ui/PageHeader'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { AdminAnalytics } from '@/types'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
  const activeCircleId = useStore(s => s.activeCircleId)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeCircleId) return
    dataService.getAdminAnalytics(activeCircleId).then(data => {
      setAnalytics(data)
      setLoading(false)
    })
  }, [activeCircleId])

  if (loading || !analytics) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <PageHeader title="Analytics Dashboard" />
        <div className="p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Alerts',
      value: analytics.totalAlerts,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'SOS Events',
      value: analytics.totalSOS,
      icon: Shield,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Geofence Breaches',
      value: analytics.geofenceBreaches,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Avg SOS Response',
      value: `${analytics.avgSOSResponseTimeMinutes}m`,
      icon: Clock,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
  ]

  const chartData = analytics.alertsPerDay.map((d, i) => ({
    date: d.date.slice(5), // MM-DD
    alerts: d.count,
    members: analytics.activeMembersPerDay[i]?.count ?? 0,
  }))

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Analytics Dashboard" subtitle="Last 7 days" />

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 pt-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ title, value, icon: Icon, color, bg }) => (
            <div key={title} className="card p-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
            </div>
          ))}
        </div>

        {/* Alerts chart */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Alerts per Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="url(#alertGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active members chart */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Active Members per Day</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Daily Summary</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 px-1">
              <span>Date</span>
              <span className="text-center">Alerts</span>
              <span className="text-center">Members</span>
            </div>
            {chartData.map(d => (
              <div key={d.date} className="grid grid-cols-3 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="text-slate-600 dark:text-slate-400">{d.date}</span>
                <span className="text-center font-semibold text-orange-500">{d.alerts}</span>
                <span className="text-center font-semibold text-blue-500">{d.members}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
