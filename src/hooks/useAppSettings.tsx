import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppSettings {
  org_naam: string;
  org_logo_url: string;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSetting: (key: keyof AppSettings, value: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaults: AppSettings = { org_naam: "bengcert", org_logo_url: "" };

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaults,
  loading: true,
  updateSetting: async () => {},
  refresh: async () => {},
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setSettings({
        org_naam: map["org_naam"] ?? defaults.org_naam,
        org_logo_url: map["org_logo_url"] ?? defaults.org_logo_url,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateSetting = async (key: keyof AppSettings, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    if (error) throw error;
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, loading, updateSetting, refresh: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
