import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { MemberLocation } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface MemberMarkersProps {
  locations: MemberLocation[]
  currentUserId?: string
}

const STATUS_COLORS: Record<string, string> = {
  safe: '#22c55e',
  sos: '#ef4444',
  outside_zone: '#f97316',
  offline: '#94a3b8',
  ghost: '#94a3b8',
}

function createMemberIcon(location: MemberLocation, userName: string, userAvatar: string, isCurrentUser: boolean): L.DivIcon {
  const color = STATUS_COLORS[location.status] ?? '#22c55e'
  const batteryColor = location.batteryLevel < 15 ? '#ef4444' : location.batteryLevel < 30 ? '#f97316' : '#22c55e'
  const ringClass = location.status === 'sos' ? 'animate-ping' : ''

  return L.divIcon({
    className: '',
    iconSize: [56, 72],
    iconAnchor: [28, 72],
    popupAnchor: [0, -72],
    html: `
      <div style="position:relative; width:56px; height:72px; display:flex; flex-direction:column; align-items:center;">
        ${location.status === 'sos' ? `<div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:48px; height:48px; border-radius:50%; background:${color}33; animation:ping 1s infinite;"></div>` : ''}
        <div style="
          width:48px; height:48px; border-radius:50%;
          background:white; border:3px solid ${color};
          display:flex; align-items:center; justify-content:center;
          font-size:24px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          ${isCurrentUser ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px ' + color + ';' : ''}
        ">
          ${userAvatar}
        </div>
        <div style="
          background:white; border:1px solid #e2e8f0; border-radius:8px;
          padding:2px 6px; font-size:10px; font-weight:600;
          white-space:nowrap; margin-top:2px; color:#0f172a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          max-width:80px; overflow:hidden; text-overflow:ellipsis;
        ">
          ${userName.split(' ')[0]}
          <span style="color:${batteryColor}; margin-left:2px;">${location.batteryLevel}%</span>
        </div>
      </div>
    `,
  })
}

export default function MemberMarkers({ locations, currentUserId }: MemberMarkersProps) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Load users for names/avatars
  const usersData = (() => {
    try {
      const users = JSON.parse(localStorage.getItem('sc_users') ?? '[]') as Array<{ id: string; name: string; avatar: string }>
      return Object.fromEntries(users.map(u => [u.id, u]))
    } catch { return {} as Record<string, { name: string; avatar: string }> }
  })()

  useEffect(() => {
    const existingIds = new Set<string>()

    locations.forEach(loc => {
      if (!loc.isSharing && loc.userId !== currentUserId) return
      const key = `${loc.userId}-${loc.circleId}`
      existingIds.add(key)

      const userData = usersData[loc.userId] ?? { name: 'Unknown', avatar: '👤' }
      const isCurrentUser = loc.userId === currentUserId
      const icon = createMemberIcon(loc, userData.name, userData.avatar, isCurrentUser)
      const latlng: [number, number] = [loc.location.lat, loc.location.lng]
      let lastSeen = 'recently'
      try {
        if (loc.lastSeen) {
          const d = new Date(loc.lastSeen)
          if (!isNaN(d.getTime())) {
            lastSeen = formatDistanceToNow(d, { addSuffix: true })
          }
        }
      } catch {
        lastSeen = 'recently'
      }

      const popupContent = `
        <div style="font-family:Inter,sans-serif; min-width:160px;">
          <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${userData.avatar} ${userData.name}</div>
          <div style="font-size:12px; color:#64748b; margin-bottom:2px;">Status: <strong style="color:${STATUS_COLORS[loc.status]}">${loc.status.replace('_', ' ').toUpperCase()}</strong></div>
          <div style="font-size:12px; color:#64748b; margin-bottom:2px;">Battery: ${loc.batteryLevel}% ${loc.batteryCharging ? '⚡' : ''}</div>
          ${loc.location.speed !== undefined ? `<div style="font-size:12px; color:#64748b; margin-bottom:2px;">Speed: ${Math.round((loc.location.speed ?? 0) * 3.6)} km/h</div>` : ''}
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Updated ${lastSeen}</div>
        </div>
      `

      if (markersRef.current.has(key)) {
        const marker = markersRef.current.get(key)!
        // Smooth animated movement
        const currentLatLng = marker.getLatLng()
        const targetLatLng = L.latLng(latlng[0], latlng[1])
        if (currentLatLng.distanceTo(targetLatLng) > 1) {
          // Animate over 1 second
          const steps = 20
          const stepLat = (latlng[0] - currentLatLng.lat) / steps
          const stepLng = (latlng[1] - currentLatLng.lng) / steps
          let step = 0
          const interval = setInterval(() => {
            if (step >= steps) { clearInterval(interval); return }
            marker.setLatLng([
              currentLatLng.lat + stepLat * (step + 1),
              currentLatLng.lng + stepLng * (step + 1),
            ])
            step++
          }, 50)
        }
        marker.setIcon(icon)
        marker.getPopup()?.setContent(popupContent)
      } else {
        const marker = L.marker(latlng, { icon, zIndexOffset: isCurrentUser ? 1000 : 0 })
          .bindPopup(popupContent)
          .addTo(map)
        markersRef.current.set(key, marker)
      }
    })

    // Remove markers for members no longer in locations
    markersRef.current.forEach((marker, key) => {
      if (!existingIds.has(key)) {
        marker.remove()
        markersRef.current.delete(key)
      }
    })
  }, [locations, map, currentUserId, usersData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
    }
  }, [])

  return null
}
