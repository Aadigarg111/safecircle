import { useEffect, useRef } from 'react';

const SHAKE_THRESHOLD = 15; // m/s²
const SHAKE_TIMEOUT = 1000; // ms between shakes

export function useShakeDetect(onShake: () => void, enabled = true): void {
  const lastShakeRef = useRef<number>(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;
      const { x = 0, y = 0, z = 0 } = accel;
      const last = lastAccelRef.current;
      const delta = Math.abs((x ?? 0) - last.x) + Math.abs((y ?? 0) - last.y) + Math.abs((z ?? 0) - last.z);
      lastAccelRef.current = { x: x ?? 0, y: y ?? 0, z: z ?? 0 };

      if (delta > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeRef.current > SHAKE_TIMEOUT) {
          lastShakeRef.current = now;
          onShake();
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onShake, enabled]);
}
