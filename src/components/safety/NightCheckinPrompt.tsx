import { useState, useEffect, useRef } from 'react'
import { Moon, CheckCircle, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { useGeolocation } from '@/hooks/useGeolocation'

const CHECK_AFTER_HOUR = 21
const CHECK_INTERVAL_MS = 30 * 60 * 1000
const RESPONSE_TIMEOUT_MS = 2 * 60 * 1000

export default function NightCheckinPrompt() {
  const [show, setShow] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeCircleId = useStore(s => s.activeCircleId)
  const setActiveSOS = useStore(s => s.setActiveSOS)
  const { location } = useGeolocation()

  const triggerAutoSOS = async () => {
    const loc = location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
    if (activeCircleId) {
      const sos = await dataService.triggerSOS(activeCircleId, loc, 'night_checkin')
      setActiveSOS(sos)
    }
    setShow(false)
  }

  const showPrompt = () => {
    setShow(true)
    setCountdown(120)
    countdownTimerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
    responseTimerRef.current = setTimeout(() => {
      triggerAutoSOS()
    }, RESPONSE_TIMEOUT_MS)
  }

  // Check every 30 minutes after 9 PM
  useEffect(() => {
    const check = () => {
      if (new Date().getHours() >= CHECK_AFTER_HOUR && !show) {
        showPrompt()
      }
    }
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      clearInterval(interval)
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [show, activeCircleId])

  const handleSafe = () => {
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    setShow(false)
  }

  const handleHelp = () => {
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    triggerAutoSOS()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[8000] bg-black/70 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
            <Moon size={24} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Night Check-in</h2>
            <p className="text-sm text-slate-500">It's late — are you safe?</p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <p className="text-sm text-orange-700 dark:text-orange-400">
            SOS will auto-trigger in <strong>{countdown}s</strong> if no response
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSafe}
            className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle size={22} /> I'm Safe
          </button>
          <button
            onClick={handleHelp}
            className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 text-lg"
          >
            🆘 Need Help
          </button>
        </div>
      </div>
    </div>
  )
}
