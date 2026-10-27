import { useLocation } from 'react-router-dom'
import SOSButton from './SOSButton'
import { useStore } from '@/store'

// Shows a compact floating SOS button on every page except the SOS page itself
export default function FloatingSOS() {
  const pathname = useLocation().pathname
  const activeCircleId = useStore(s => s.activeCircleId)
  const showSOSModal = useStore(s => s.showSOSModal)

  if (pathname === '/sos' || showSOSModal) return null

  return (
    <div className="fixed bottom-24 right-4 z-[1000]">
      <SOSButton size="sm" circleId={activeCircleId} />
    </div>
  )
}
