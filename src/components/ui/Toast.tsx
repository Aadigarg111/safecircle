import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import clsx from 'clsx'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Simple event-based toast system
const listeners: ((toast: ToastMessage) => void)[] = []

export function showToast(toast: Omit<ToastMessage, 'id'>): void {
  const msg = { ...toast, id: crypto.randomUUID() }
  listeners.forEach(l => l(msg))
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-orange-500" />,
  info: <Info size={18} className="text-blue-500" />,
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration ?? 4000)
    }
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9000] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'card flex items-start gap-3 p-3 pointer-events-auto shadow-lg',
            'animate-in slide-in-from-top-2 duration-200',
          )}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
            {t.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{t.message}</p>}
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(m => m.id !== t.id))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
