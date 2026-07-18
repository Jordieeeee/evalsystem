import { useEffect, useState } from 'react';
import { systemService, DEFAULT_GENERAL_SETTINGS } from '../services/systemService';

// Live-reads the system_settings/general doc (university info + display
// toggles) so pages outside the Settings screen -- the dashboard's Activity
// Feed, the students table's density -- reflect changes without a refresh.
export function useSystemSettings() {
  const [settings, setSettings] = useState(DEFAULT_GENERAL_SETTINGS);

  useEffect(() => {
    const unsubscribe = systemService.subscribeToGeneralSettings(setSettings);
    return () => unsubscribe();
  }, []);

  return settings;
}
