import { useState, useEffect } from 'react'
import { X, MapPin, Phone, MessageCircle, CheckCircle } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { useGeolocation } from '@/hooks/useGeolocation'
import { showToast } from '@/components/ui/Toast'

export default function SOSModal() {
  const setShowSOSModal = useStore(s => s.setShowSOSModal)
  const activeSOS = useStore(s => s.activeSOS)
  const setActiveSOS = useStore(s => s.setActiveSOS)
  const { location } = useGeolocation()
  const [resolved, setResolved] = useState(false)

  // Play alarm sound
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 2)
    return () => { ctx.close().catch(() => {}) }
  }, [])

  const handleResolve = async () => {
    if (activeSOS) {
      await dataService.resolveSOSEvent(activeSOS.id)
      setActiveSOS(null)
    }
    setResolved(true)
    setTimeout(() => setShowSOSModal(false), 1500)
    showToast({ type: 'success', title: '✅ SOS resolved', message: 'Your circle has been notified you are safe' })
  }

  const handleWhatsApp = () => {
    const lat = location?.lat ?? activeSOS?.location.lat ?? 28.6139
    const lng = location?.lng ?? activeSOS?.location.lng ?? 77.2090
    const msg = encodeURIComponent(`🆘 I need help! My live location:\nhttps://www.openstreetmap.org/#map=17/${lat}/${lng}\n\nSent via SafeCircle`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleCallEmergency = () => {
    window.open('tel:112', '_self')
  }

  const lat = location?.lat ?? activeSOS?.location.lat ?? 28.6139
  const lng = location?.lng ?? activeSOS?.location.lng ?? 77.2090

  return (
    <div className="fixed inset-0 z-[9500] flex flex-col bg-red-600">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">🆘 SOS ACTIVE</h1>
          <p className="text-red-200 text-sm mt-1">Your circle has been alerted</p>
        </div>
        <button
          onClick={() => setShowSOSModal(false)}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Pulsing indicator */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <div className="absolute inset-4 rounded-full bg-white/10 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-6xl">🆘</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white font-semibold text-lg">Contacting your circle...</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <MapPin size={14} className="text-red-200" />
            <p className="text-red-200 text-sm">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handleCallEmergency}
            className="w-full bg-white text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
          >
            <Phone size={22} /> Call 112 (Emergency)
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> Send WhatsApp SOS
          </button>
          <a
            href={`https://www.openstreetmap.org/#map=17/${lat}/${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white/20 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <MapPin size={18} /> Share Live Location
          </a>
        </div>
      </div>

      {/* Resolve button */}
      <div className="px-6 pb-10">
        {resolved ? (
          <div className="flex items-center justify-center gap-2 text-white font-semibold">
            <CheckCircle size={20} /> SOS Resolved — Stay safe!
          </div>
        ) : (
          <button
            onClick={handleResolve}
            className="w-full bg-white/20 border-2 border-white text-white font-bold py-4 rounded-2xl"
          >
            ✅ I am safe — Cancel SOS
          </button>
        )}
      </div>
    </div>
  )
}
