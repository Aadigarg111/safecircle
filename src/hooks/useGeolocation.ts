import { useEffect, useRef, useState } from 'react';
import type { LocationPoint } from '@/types';

interface GeolocationState {
  location: LocationPoint | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enabled = true): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ location: null, error: null, loading: true });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation not supported', loading: false }));
      return;
    }

    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          loading: false,
          error: null,
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed ?? undefined,
            heading: pos.coords.heading ?? undefined,
            altitude: pos.coords.altitude ?? undefined,
            timestamp: new Date(pos.timestamp).toISOString(),
          },
        });
      },
      (err) => {
        // Fall back to New Delhi center for demo
        setState({
          loading: false,
          error: err.message,
          location: {
            lat: 28.6139,
            lng: 77.2090,
            accuracy: 100,
            timestamp: new Date().toISOString(),
          },
        });
      },
      opts,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled]);

  return state;
}
