import type { SafePlace, LocationPoint } from '@/types'
import { haversineDistance } from '@/hooks/useGeofence'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

type AmenityType = 'police' | 'hospital' | 'pharmacy'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: {
    name?: string
    amenity?: string
    'addr:full'?: string
    'addr:street'?: string
  }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export async function fetchSafePlaces(
  lat: number,
  lng: number,
  radiusMeters = 2000,
): Promise<SafePlace[]> {
  const amenities: AmenityType[] = ['police', 'hospital', 'pharmacy']
  const query = `
    [out:json][timeout:15];
    (
      node[amenity~"${amenities.join('|')}"](around:${radiusMeters},${lat},${lng});
      way[amenity~"${amenities.join('|')}"](around:${radiusMeters},${lat},${lng});
    );
    out center 30;
  `

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
  })

  if (!response.ok) throw new Error(`Overpass API error: ${response.status}`)

  const data: OverpassResponse = await response.json()
  const origin = { lat, lng }

  return data.elements
    .filter(el => el.tags.amenity && amenities.includes(el.tags.amenity as AmenityType))
    .map(el => {
      const elLat = el.lat ?? el.center?.lat ?? 0
      const elLng = el.lon ?? el.center?.lon ?? 0
      const loc: LocationPoint = { lat: elLat, lng: elLng, timestamp: new Date().toISOString() }
      const distance = haversineDistance(origin, { lat: elLat, lng: elLng })
      const address = el.tags['addr:full'] ?? el.tags['addr:street'] ?? undefined

      return {
        id: String(el.id),
        name: el.tags.name ?? `${el.tags.amenity} (unnamed)`,
        type: el.tags.amenity as AmenityType,
        location: loc,
        address,
        distance,
        etaMinutes: Math.round(distance / 80), // ~80m/min walking
      }
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, 20)
}

export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ polyline: [number, number][]; distanceKm: number; durationMinutes: number }> {
  const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
  const response = await fetch(url)
  if (!response.ok) throw new Error('OSRM routing failed')
  const data = await response.json() as {
    routes: Array<{
      distance: number
      duration: number
      geometry: { coordinates: [number, number][] }
    }>
  }
  const route = data.routes[0]
  if (!route) throw new Error('No route found')
  return {
    polyline: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMinutes: Math.round(route.duration / 60),
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeCircle/1.0' },
  })
  if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  const data = await response.json() as { display_name?: string }
  return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export async function searchAddress(query: string): Promise<Array<{ name: string; lat: number; lng: number }>> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeCircle/1.0' },
  })
  if (!response.ok) return []
  const data = await response.json() as Array<{ display_name: string; lat: string; lon: string }>
  return data.map(d => ({ name: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
}
