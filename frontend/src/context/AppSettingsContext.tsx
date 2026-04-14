import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type EditorTheme = 'vs-dark' | 'light' | 'hc-black' | 'monokai' | 'dracula' | 'cobalt';

interface AppSettings {
  editorTheme: EditorTheme;
  fontSize: number;
  tabSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  editorTheme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  wordWrap: 'on',
  minimap: false,
  lineNumbers: 'on',
  cursorBlinking: 'smooth',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
