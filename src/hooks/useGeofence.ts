import { useEffect, useRef } from 'react';
import type { Geofence, Alert } from '@/types';
import { useStore } from '@/store';

/** Haversine distance in meters between two lat/lng points */
export function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const aVal = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

/** Point-in-polygon using ray casting algorithm */
export function pointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Check if a location is inside a geofence */
export function isInsideGeofence(location: { lat: number; lng: number }, geofence: Geofence): boolean {
  if (geofence.shape === 'circle' && geofence.center && geofence.radius) {
    return haversineDistance(location, geofence.center) <= geofence.radius;
  }
  if (geofence.shape === 'polygon' && geofence.coordinates) {
    return pointInPolygon(location, geofence.coordinates);
  }
  return false;
}

/** Distance from a point to a polyline (route deviation detection) in meters */
export function distanceToPolyline(point: { lat: number; lng: number }, polyline: { lat: number; lng: number }[]): number {
  if (polyline.length === 0) return Infinity;
  let minDist = Infinity;
  for (const p of polyline) {
    const d = haversineDistance(point, p);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

interface GeofenceState {
  [memberId: string]: {
    [geofenceId: string]: boolean; // true = inside
  };
}

/**
 * Hook that monitors member locations against geofences and fires
 * entry/exit alerts. Uses previous state to avoid duplicate alerts.
 */
export function useGeofenceMonitor(circleId: string | null): void {
  const geofences = useStore(s => s.geofences);
  const memberLocations = useStore(s => s.memberLocations);
  const addAlert = useStore(s => s.addAlert);
  const user = useStore(s => s.user);
  const stateRef = useRef<GeofenceState>({});

  useEffect(() => {
    if (!circleId || !user) return;

    memberLocations.forEach(ml => {
      geofences.forEach(gf => {
        if (gf.circleId !== circleId) return;
        const prev = stateRef.current[ml.userId]?.[gf.id];
        const current = isInsideGeofence(ml.location, gf);

        // Initialise without firing alert
        if (prev === undefined) {
          stateRef.current[ml.userId] = { ...(stateRef.current[ml.userId] ?? {}), [gf.id]: current };
          return;
        }

        if (prev === current) return; // No change

        // State changed — fire alert
        stateRef.current[ml.userId][gf.id] = current;
        const alertType = current ? 'geofence_entry' : 'geofence_exit';
        const users = JSON.parse(localStorage.getItem('sc_users') ?? '[]') as { id: string; name: string }[];
        const member = users.find(u => u.id === ml.userId);
        const memberName = member?.name ?? 'Someone';

        const alert: Alert = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          type: alertType,
          userId: ml.userId,
          userName: memberName,
          circleId,
          message: current
            ? `${memberName} arrived at ${gf.name}`
            : `${memberName} left ${gf.name}`,
          location: ml.location,
          geofenceId: gf.id,
          geofenceName: gf.name,
          timestamp: new Date().toISOString(),
          read: false,
          severity: 'info',
        };
        addAlert(alert);

        // Persist and broadcast
        const existing = JSON.parse(localStorage.getItem('sc_alerts') ?? '[]') as Alert[];
        existing.push(alert);
        localStorage.setItem('sc_alerts', JSON.stringify(existing));
        try {
          const bc = new BroadcastChannel('safecircle');
          bc.postMessage({ type: 'alert', payload: alert });
          bc.close();
        } catch { /* ignore */ }

        // Browser notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`SafeCircle: ${alert.message}`, { icon: '/favicon.svg', tag: alert.id });
        }
      });
    });
  }, [memberLocations, geofences, circleId, addAlert, user]);
}
