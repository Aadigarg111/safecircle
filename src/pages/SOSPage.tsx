import { useState } from 'react'
import { Phone, Video, Calculator, Mic, MapPin, MessageCircle, Moon } from 'lucide-react'
import { useStore } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import SOSButton from '@/components/sos/SOSButton'
import HelplineHub from '@/components/safety/HelplineHub'
import EvidenceCapture from '@/components/safety/EvidenceCapture'
import ReportIncident from '@/components/safety/ReportIncident'
import Modal from '@/components/ui/Modal'

type ActivePanel = null | 'helplines' | 'evidence' | 'report'

export default function SOSPage() {
  const user = useStore(s => s.user)
  const activeCircleId = useStore(s => s.activeCircleId)
  const setFakeCall = useStore(s => s.setFakeCall)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [showSilentSOS, setShowSilentSOS] = useState(false)
  const [fakeCallName, setFakeCallName] = useState('Mom')
  const [fakeCallDelay, setFakeCallDelay] = useState(0)

  const handleFakeCall = () => {
    setTimeout(() => {
      setFakeCall(true, fakeCallName)
    }, fakeCallDelay * 1000)
    if (fakeCallDelay > 0) {
      alert(`Fake call from "${fakeCallName}" will arrive in ${fakeCallDelay} seconds`)
    }
  }

  const features = [
    {
      icon: Phone,
      label: 'Helplines',
      sublabel: '112, 1091, 181...',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      onClick: () => setActivePanel('helplines'),
    },
    {
      icon: Video,
      label: 'Fake Call',
      sublabel: 'Escape any situation',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      onClick: handleFakeCall,
    },
    {
      icon: Calculator,
      label: 'Silent SOS',
      sublabel: 'Discreet trigger',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      onClick: () => setShowSilentSOS(true),
    },
    {
      icon: Mic,
      label: 'Evidence',
      sublabel: 'Record audio/photo',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      onClick: () => setActivePanel('evidence'),
    },
    {
      icon: MapPin,
      label: 'Report Spot',
      sublabel: 'Mark unsafe area',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      onClick: () => setActivePanel('report'),
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp SOS',
      sublabel: 'Send location link',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      onClick: () => {
        const msg = encodeURIComponent(`🆘 I need help! My location: https://www.openstreetmap.org/#map=15/28.6139/77.2090`)
        window.open(`https://wa.me/?text=${msg}`, '_blank')
      },
    },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Safety Hub" subtitle="Women Safety Suite" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Main SOS Button */}
        <div className="card p-5 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hold 3 seconds to activate SOS</p>
          <SOSButton size="lg" circleId={activeCircleId} />
          <p className="text-xs text-slate-400">Shake phone to trigger · Voice: "help me"</p>
        </div>

        {/* Fake call setup */}
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-white">Fake Call Setup</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={fakeCallName}
              onChange={e => setFakeCallName(e.target.value)}
              className="input flex-1"
              placeholder="Caller name"
            />
            <select
              value={fakeCallDelay}
              onChange={e => setFakeCallDelay(Number(e.target.value))}
              className="input w-24"
            >
              {[0, 10, 30, 60, 120].map(s => (
                <option key={s} value={s}>{s === 0 ? 'Now' : `${s}s`}</option>
              ))}
            </select>
          </div>
          <button onClick={handleFakeCall} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Phone size={16} /> Simulate Incoming Call
          </button>
        </div>

        {/* Feature grid */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Safety Tools</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, sublabel, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="card p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all active:scale-95 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panels */}
      <Modal isOpen={activePanel === 'helplines'} onClose={() => setActivePanel(null)} title="Emergency Helplines">
        <HelplineHub />
      </Modal>
      <Modal isOpen={activePanel === 'evidence'} onClose={() => setActivePanel(null)} title="Evidence Capture" size="lg">
        <EvidenceCapture onClose={() => setActivePanel(null)} />
      </Modal>
      <Modal isOpen={activePanel === 'report'} onClose={() => setActivePanel(null)} title="Report Unsafe Spot">
        <ReportIncident onClose={() => setActivePanel(null)} />
      </Modal>

      {/* Silent SOS disguise */}
      {showSilentSOS && (
        <div className="fixed inset-0 z-[9000] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center">
          <SilentSOSCalculator onClose={() => setShowSilentSOS(false)} circleId={activeCircleId} />
        </div>
      )}
    </div>
  )
}

// Silent SOS disguised as a calculator
function SilentSOSCalculator({ onClose, circleId }: { onClose: () => void; circleId: string | null }) {
  const [display, setDisplay] = useState('0')
  const [tapCount, setTapCount] = useState(0)
  const [triggered, setTriggered] = useState(false)
  const setActiveSOS = useStore(s => s.setActiveSOS)

  const handleButton = (val: string) => {
    if (val === '=') {
      const newCount = tapCount + 1
      setTapCount(newCount)
      if (newCount >= 5 && !triggered) {
        setTriggered(true)
        // Trigger SOS silently
        navigator.vibrate?.([100, 50, 100])
        import('@/services').then(({ dataService }) => {
          const loc = { lat: 28.6139, lng: 77.2090, timestamp: new Date().toISOString() }
          if (circleId) {
            dataService.triggerSOS(circleId, loc, 'silent').then(sos => {
              setActiveSOS(sos)
            })
          }
        })
        setDisplay('SOS SENT')
        setTimeout(() => onClose(), 2000)
        return
      }
    }
    if (display === '0' || display === 'SOS SENT') {
      setDisplay(val === '.' ? '0.' : val)
    } else {
      setDisplay(d => d + val)
    }
  }

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ]

  return (
    <div className="w-full max-w-xs">
      <div className="text-right text-4xl font-light text-slate-800 dark:text-white p-6 bg-slate-200 dark:bg-slate-800 rounded-t-3xl">
        {display}
      </div>
      {triggered && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-bold">
          🆘 SOS Triggered Silently
        </div>
      )}
      <p className="text-center text-xs text-slate-400 py-1">Press = 5 times quickly to trigger SOS</p>
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-300 dark:bg-slate-700 rounded-b-3xl">
        {buttons.map((row, i) =>
          row.map((btn, j) => (
            <button
              key={`${i}-${j}`}
              onClick={() => handleButton(btn)}
              className={`py-4 rounded-xl text-lg font-medium transition-colors ${
                ['÷', '×', '-', '+', '='].includes(btn)
                  ? 'bg-orange-400 text-white'
                  : 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white'
              }`}
            >
              {btn}
            </button>
          ))
        )}
      </div>
      <button onClick={onClose} className="w-full text-center text-xs text-slate-400 py-3">
        Tap to close
      </button>
    </div>
  )
}
