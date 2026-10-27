import { useState, useEffect } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { useStore } from '@/store'

interface FakeCallScreenProps {
  callerName: string
}

export default function FakeCallScreen({ callerName }: FakeCallScreenProps) {
  const setFakeCall = useStore(s => s.setFakeCall)
  const [answered, setAnswered] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Ringtone via Web Audio API
  useEffect(() => {
    if (answered) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const playTone = () => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 440
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    }

    playTone()
    const interval = setInterval(playTone, 1500)
    navigator.vibrate?.([400, 200, 400, 200, 400])

    return () => {
      clearInterval(interval)
      ctx.close().catch(() => {})
    }
  }, [answered])

  // Timer when answered
  useEffect(() => {
    if (!answered) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [answered])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="fake-call-overlay">
      {/* Caller info */}
      <div className="flex flex-col items-center mt-16 px-6 text-center">
        <div className="w-28 h-28 rounded-full bg-slate-700 flex items-center justify-center text-6xl mb-4 shadow-2xl">
          📞
        </div>
        <p className="text-slate-400 text-sm">{answered ? 'Active Call' : 'Incoming Call...'}</p>
        <h1 className="text-3xl font-bold text-white mt-2">{callerName}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {answered ? formatTime(elapsed) : 'Mobile · India'}
        </p>
      </div>

      {/* Call actions */}
      <div className="pb-16 px-8 w-full">
        {!answered ? (
          <div className="flex items-center justify-between mt-8">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setFakeCall(false)}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
              <span className="text-white text-sm">Decline</span>
            </div>

            {/* Answer */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setAnswered(true)}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-bounce"
              >
                <Phone size={28} className="text-white" />
              </button>
              <span className="text-white text-sm">Answer</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-4 w-full">
              {['Mute', 'Speaker', 'Hold'].map(action => (
                <button key={action} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-xl">
                      {action === 'Mute' ? '🔇' : action === 'Speaker' ? '🔊' : '⏸'}
                    </span>
                  </div>
                  <span className="text-white text-xs">{action}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setFakeCall(false)}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
            <span className="text-white text-sm">End Call</span>
          </div>
        )}
      </div>
    </div>
  )
}
