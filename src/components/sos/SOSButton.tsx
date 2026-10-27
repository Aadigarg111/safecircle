import { useState, useRef, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useShakeDetect } from '@/hooks/useShakeDetect'
import { showToast } from '@/components/ui/Toast'
import clsx from 'clsx'

interface SOSButtonProps {
  size?: 'sm' | 'md' | 'lg'
  circleId?: string | null
}

export default function SOSButton({ size = 'md', circleId }: SOSButtonProps) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [triggered, setTriggered] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartRef = useRef<number>(0)
  const setActiveSOS = useStore(s => s.setActiveSOS)
  const setShowSOSModal = useStore(s => s.setShowSOSModal)
  const { location } = useGeolocation()

  const HOLD_DURATION = 3000 // ms

  const triggerSOS = useCallback(async (triggerType: 'button' | 'shake' = 'button') => {
    if (triggered) return
    setTriggered(true)
    navigator.vibrate?.([200, 100, 200, 100, 400])
    const loc = location ?? { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
    try {
      if (circleId) {
        const sos = await dataService.triggerSOS(circleId, loc, triggerType)
        setActiveSOS(sos)
      }
      setShowSOSModal(true)
      showToast({ type: 'error', title: '🆘 SOS Triggered!', message: 'Your circle has been alerted', duration: 6000 })
    } catch (e) {
      showToast({ type: 'error', title: 'SOS failed', message: String(e) })
    }
    setTimeout(() => setTriggered(false), 5000)
  }, [triggered, location, circleId, setActiveSOS, setShowSOSModal])

  // Shake detection
  useShakeDetect(() => triggerSOS('shake'), true)

  // Voice detection "help me"
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const lastIndex = e.results.length - 1
      const transcript = e.results[lastIndex][0].transcript.toLowerCase()
      if (transcript.includes('help me') || transcript.includes('madad karo')) {
        triggerSOS('button')
      }
    }
    try { recognition.start() } catch { /* ignored */ }
    return () => { try { recognition.stop() } catch { /* ignored */ } }
  }, [triggerSOS])

  const startHold = () => {
    if (triggered) return
    setHolding(true)
    holdStartRef.current = Date.now()
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setProgress(pct)
      if (elapsed >= HOLD_DURATION) {
        endHold()
        triggerSOS('button')
      }
    }, 50)
  }

  const endHold = () => {
    setHolding(false)
    setProgress(0)
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const sizeClasses = {
    sm: 'w-14 h-14 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-32 h-32 text-base',
  }

  const iconSize = { sm: 20, md: 28, lg: 44 }[size]

  return (
    <div className="relative flex items-center justify-center">
      {/* Progress ring */}
      {holding && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
          style={{ width: '100%', height: '100%' }}
        >
          <circle
            cx="50" cy="50" r="46"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4"
          />
          <circle
            cx="50" cy="50" r="46"
            fill="none" stroke="white" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
      )}

      <button
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        className={clsx(
          'rounded-full bg-red-500 text-white font-bold shadow-2xl shadow-red-500/50',
          'flex flex-col items-center justify-center gap-1',
          'transition-all duration-150 select-none',
          'active:scale-95 hover:bg-red-600',
          sizeClasses[size],
          triggered && 'bg-red-700',
          holding && 'scale-95 bg-red-600',
          !triggered && 'sos-pulse',
        )}
        aria-label="SOS Button - Hold 3 seconds to activate"
      >
        <AlertTriangle size={iconSize} />
        <span className="leading-none font-black">SOS</span>
      </button>
    </div>
  )
}
