import { useEffect, useState } from 'react';

interface BatteryState {
  level: number;
  charging: boolean;
  supported: boolean;
}

export function useBattery(): BatteryState {
  const [state, setState] = useState<BatteryState>({ level: 100, charging: false, supported: false });

  useEffect(() => {
    // @ts-expect-error Battery API is experimental
    if (!navigator.getBattery) return;

    // @ts-expect-error Battery API is experimental
    navigator.getBattery().then((battery: { level: number; charging: boolean; addEventListener: (event: string, handler: () => void) => void }) => {
      const update = () => setState({ level: Math.round(battery.level * 100), charging: battery.charging, supported: true });
      update();
      battery.addEventListener('levelchange', update);
      battery.addEventListener('chargingchange', update);
    });
  }, []);

  return state;
}
