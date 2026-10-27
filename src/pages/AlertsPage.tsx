import { useState, useEffect } from 'react'
import { Bell, Filter, Download, CheckCheck } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { formatDistanceToNow } from 'date-fns'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { showToast } from '@/components/ui/Toast'
import type { Alert, AlertType } from '@/types'
import clsx from 'clsx'

const SEVERITY_STYLES: Record<Alert['severity'], string> = {
  info: 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/10',
  warning: 'border-l-orange-400 bg-orange-50 dark:bg-orange-900/10',
  critical: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
}

const TYPE_LABELS: Record<AlertType, string> = {
  geofence_entry: '📍 Arrived',
  geofence_exit: '🚶 Left',
  sos: '🆘 SOS',
  battery_low: '🔋 Battery',
  route_deviation: '⚠️ Off Route',
  check_in: '✅ Check-in',
  anomaly: '🔍 Anomaly',
  night_checkin: '🌙 Night Check-in',
}

const FILTER_OPTIONS: (AlertType | 'all')[] = ['all', 'sos', 'geofence_entry', 'geofence_exit', 'battery_low']

export default function AlertsPage() {
  const alerts = useStore(s => s.alerts)
  const markAlertRead = useStore(s => s.markAlertRead)
  const activeCircleId = useStore(s => s.activeCircleId)
  const [filter, setFilter] = useState<AlertType | 'all'>('all')

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.type === filter)

  const handleMarkRead = async (id: string) => {
    markAlertRead(id)
    await dataService.markAlertRead(id)
  }

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.read)
    for (const a of unread) {
      markAlertRead(a.id)
      await dataService.markAlertRead(a.id)
    }
    showToast({ type: 'success', title: 'All alerts marked as read' })
  }

  const handleExportCSV = () => {
    const rows = [
      ['Time', 'Type', 'Member', 'Message', 'Severity'],
      ...filteredAlerts.map(a => [
        new Date(a.timestamp).toLocaleString(),
        a.type,
        a.userName,
        a.message,
        a.severity,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safecircle-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast({ type: 'success', title: 'Alerts exported as CSV' })
  }

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('SafeCircle Alert History', 14, 15)
      doc.setFontSize(10)
      doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 22)
      autoTable(doc, {
        startY: 28,
        head: [['Time', 'Type', 'Member', 'Message', 'Severity']],
        body: filteredAlerts.map(a => [
          new Date(a.timestamp).toLocaleString(),
          TYPE_LABELS[a.type] ?? a.type,
          a.userName,
          a.message,
          a.severity,
        ]),
        styles: { fontSize: 8 },
      })
      doc.save(`safecircle-alerts-${new Date().toISOString().split('T')[0]}.pdf`)
      showToast({ type: 'success', title: 'Alerts exported as PDF' })
    } catch (e) {
      showToast({ type: 'error', title: 'PDF export failed', message: String(e) })
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader
        title="Alerts"
        subtitle={`${alerts.filter(a => !a.read).length} unread`}
        right={
          <div className="flex items-center gap-1">
            <button onClick={handleMarkAllRead} className="btn-ghost p-2" title="Mark all read">
              <CheckCheck size={18} className="text-slate-500" />
            </button>
            <button onClick={handleExportCSV} className="btn-ghost p-2" title="Export CSV">
              <Download size={18} className="text-slate-500" />
            </button>
          </div>
        }
      />

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
            )}
          >
            {f === 'all' ? 'All' : TYPE_LABELS[f as AlertType] ?? f}
          </button>
        ))}
        <button
          onClick={handleExportPDF}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
        >
          <Download size={12} /> PDF
        </button>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts"
            description="You're all clear! Alerts will appear here."
          />
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={clsx(
                'card border-l-4 p-3 cursor-pointer transition-opacity',
                SEVERITY_STYLES[alert.severity],
                alert.read && 'opacity-60',
              )}
              onClick={() => !alert.read && handleMarkRead(alert.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    {!alert.read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
