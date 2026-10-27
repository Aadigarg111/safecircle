import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useBattery } from '@/hooks/useBattery'
import { useGeofenceMonitor } from '@/hooks/useGeofence'
import MemberMarkers from './MemberMarkers'
import GeofenceLayer from './GeofenceLayer'
import SafePlacesLayer from './SafePlacesLayer'
import HeatmapLayer from './HeatmapLayer'
import RouteLayer from './RouteLayer'
import MapControls from './MapControls'
import type { MemberLocation, SafePlace } from '@/types'

// Fix Leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a>',
  },
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
} as const

type TileLayerKey = keyof typeof TILE_LAYERS

interface MapViewProps {
  showSafePlaces?: boolean
  showHeatmap?: boolean
  showHistory?: boolean
  historyUserId?: string
  routePolyline?: [number, number][]
}

// Component that pans map to user's location
function LocationTracker({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap()
  const didCenter = useRef(false)

  useEffect(() => {
    if (location && !didCenter.current) {
      map.setView([location.lat, location.lng], 15)
      didCenter.current = true
    }
  }, [location, map])

  return null
}

// Component that handles map click for geofence drawing
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapView({ showSafePlaces, showHeatmap, showHistory, historyUserId, routePolyline }: MapViewProps) {
  const user = useStore(s => s.user)
  const activeCircleId = useStore(s => s.activeCircleId)
  const memberLocations = useStore(s => s.memberLocations)
  const setMemberLocations = useStore(s => s.setMemberLocations)
  const updateMemberLocation = useStore(s => s.updateMemberLocation)
  const [tileLayer, setTileLayer] = useState<TileLayerKey>('street')
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
  const [historyPoints, setHistoryPoints] = useState<[number, number][]>([])
  const mapRef = useRef<L.Map | null>(null)

  const { location, error: geoError } = useGeolocation()
  const battery = useBattery()

  // Monitor geofences
  useGeofenceMonitor(activeCircleId)

  // Publish own location
  useEffect(() => {
    if (!location || !activeCircleId || !user) return
    dataService.publishLocation(activeCircleId, location, battery.level, battery.charging)
  }, [location, activeCircleId, user, battery.level, battery.charging])

  // Load member locations
  useEffect(() => {
    if (!activeCircleId) return
    dataService.getMemberLocations(activeCircleId).then(setMemberLocations)
    const unsub = dataService.subscribeToLocations(activeCircleId, loc => {
      updateMemberLocation(loc)
    })
    return unsub
  }, [activeCircleId, setMemberLocations, updateMemberLocation])

  // Load history if needed
  useEffect(() => {
    if (!showHistory || !historyUserId) return
    const today = new Date().toISOString().split('T')[0]
    dataService.getLocationHistory(historyUserId, today).then(pts => {
      setHistoryPoints(pts.map(p => [p.lat, p.lng]))
    })
  }, [showHistory, historyUserId])

  const tile = TILE_LAYERS[tileLayer]
  const center: [number, number] = location
    ? [location.lat, location.lng]
    : [28.6139, 77.2090]

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
        ref={mapRef as React.RefObject<L.Map>}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        <LocationTracker location={location} />
        <MapClickHandler />

        <MemberMarkers
          locations={memberLocations}
          currentUserId={user?.id}
        />
        <GeofenceLayer />
        {showSafePlaces && <SafePlacesLayer places={safePlaces} />}
        {showHeatmap && <HeatmapLayer />}
        {routePolyline && routePolyline.length > 0 && (
          <RouteLayer points={routePolyline} />
        )}
        {showHistory && historyPoints.length > 0 && (
          <RouteLayer points={historyPoints} color="#8b5cf6" animated />
        )}
        <MapControls
          tileLayer={tileLayer}
          onTileLayerChange={setTileLayer}
          onCenterLocation={() => {
            if (location && mapRef.current) {
              mapRef.current.setView([location.lat, location.lng], 15)
            }
          }}
          onLoadSafePlaces={setSafePlaces}
        />
      </MapContainer>
    </div>
  )
}
