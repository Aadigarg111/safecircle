import { useState } from 'react'
import { Layers, Navigation, MapPin, Flame, Eye, EyeOff } from 'lucide-react'
import { fetchSafePlaces } from '@/services/overpass'
import { useMap } from 'react-leaflet'
import type { SafePlace } from '@/types'
import clsx from 'clsx'

type TileLayerKey = 'street' | 'satellite' | 'dark'

interface MapControlsProps {
  tileLayer: TileLayerKey
  onTileLayerChange: (layer: TileLayerKey) => void
  onCenterLocation: () => void
  onLoadSafePlaces: (places: SafePlace[]) => void
}

export default function MapControls({
  tileLayer,
  onTileLayerChange,
  onCenterLocation,
  onLoadSafePlaces,
}: MapControlsProps) {
  const map = useMap()
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [loadingSafePlaces, setLoadingSafePlaces] = useState(false)
  const [safePlacesShown, setSafePlacesShown] = useState(false)

  const handleSafePlaces = async () => {
    if (safePlacesShown) {
      onLoadSafePlaces([])
      setSafePlacesShown(false)
      return
    }
    setLoadingSafePlaces(true)
    try {
      const center = map.getCenter()
      const places = await fetchSafePlaces(center.lat, center.lng, 2000)
      onLoadSafePlaces(places)
      setSafePlacesShown(true)
    } catch (e) {
      console.error('Failed to fetch safe places:', e)
    } finally {
      setLoadingSafePlaces(false)
    }
  }

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
      {/* Center location */}
      <button
        onClick={onCenterLocation}
        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        title="Center on my location"
      >
        <Navigation size={18} className="text-blue-500" />
      </button>

      {/* Layer toggle */}
      <div className="relative">
        <button
          onClick={() => setShowLayerMenu(v => !v)}
          className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
          title="Change map layer"
        >
          <Layers size={18} className="text-slate-600 dark:text-slate-300" />
        </button>
        {showLayerMenu && (
          <div className="absolute right-12 top-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden w-32">
            {(['street', 'satellite', 'dark'] as TileLayerKey[]).map(layer => (
              <button
                key={layer}
                onClick={() => { onTileLayerChange(layer); setShowLayerMenu(false) }}
                className={clsx(
                  'w-full text-left px-3 py-2.5 text-sm capitalize transition-colors',
                  layer === tileLayer
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
                )}
              >
                {layer}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Safe Places */}
      <button
        onClick={handleSafePlaces}
        className={clsx(
          'w-10 h-10 rounded-xl shadow-lg flex items-center justify-center border transition-colors',
          safePlacesShown
            ? 'bg-blue-500 border-blue-400 text-white'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50',
        )}
        title="Safe places"
        disabled={loadingSafePlaces}
      >
        {loadingSafePlaces
          ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          : <MapPin size={18} className={safePlacesShown ? 'text-white' : 'text-blue-500'} />
        }
      </button>
    </div>
  )
}
