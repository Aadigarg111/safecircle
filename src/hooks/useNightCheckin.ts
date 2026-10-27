import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { dataService } from '@/services';
import { useGeolocation } from './useGeolocation';

// After 21:00, prompt every 30 minutes. 2 minutes to respond or SOS fires.
const CHECK_AFTER_HOUR = 21;
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const RESPONSE_TIMEOUT_MS = 2 * 60 * 1000;

export function useNightCheckin(circleId: string | null): {
  showPrompt: boolean;
  respondSafe: () => void;
  respondHelp: () => void;
} {
  const [showPrompt, setShowPrompt] = useState(false);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { location } = useGeolocation();
  const user = useStore(s => s.user);
  const setActiveSOS = useStore(s => s.setActiveSOS);

  const getHour = () => new Date().getHours();

  const triggerAutoSOS = async () => {
    if (!circleId || !location || !user) return;
    const sos = await dataService.triggerSOS(circleId, location, 'night_checkin');
    setActiveSOS(sos);
  };

  const startResponseTimer = () => {
    setShowPrompt(true);
    responseTimerRef.current = setTimeout(() => {
      triggerAutoSOS();
    }, RESPONSE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!circleId) return;
    const interval = setInterval(() => {
      if (getHour() >= CHECK_AFTER_HOUR) {
        startResponseTimer();
      }
    }, CHECK_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    };
  }, [circleId, location, user]);

  return {
    showPrompt,
    respondSafe: () => {
      setShowPrompt(false);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    },
    respondHelp: () => {
      setShowPrompt(false);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
      triggerAutoSOS();
    },
  };
}
