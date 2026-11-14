import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider, type Language } from '../i18n';
import { KitPage } from '../kit/KitPage';
import type { SignupServices } from '../services';
import { ShellA } from '../shells/a/ShellA';
import { ShellB } from '../shells/b/ShellB';
import { createDeviceMemory, type DeviceMemory } from '../state/deviceMemory';
import { defaultConfig, type AppConfig } from './config';
import { SignupRoot } from './SignupRoot';
import { TextSizeProvider } from './TextSizeProvider';

// Language and text size are remembered on this device (SPEC 4.5, 4.6 and 10.2).
const memory = createDeviceMemory({ enabled: defaultConfig.deviceMemory });
const rememberLanguage = (language: Language) => memory.savePrefs({ language });
const rememberTextSize = (textSizeStep: number) => memory.savePrefs({ textSizeStep });

// "/" in development; "/<repository>" when published under a sub-path.
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

interface AppRoutesProps {
  config?: AppConfig;
  services?: SignupServices;
  memory?: DeviceMemory;
}

/** Option A at /a, option B at /b, the component kit at /kit. Both options share one draft. */
export function AppRoutes({ config, services, memory: store }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/kit" element={<KitPage />} />
      <Route element={<SignupRoot config={config} services={services} memory={store} />}>
        <Route path="/a/*" element={<ShellA />} />
        <Route path="/b/*" element={<ShellB />} />
      </Route>
      <Route path="*" element={<Navigate to="/a" replace />} />
    </Routes>
  );
}

export function App() {
  const [prefs] = useState(() => memory.read().prefs);
  return (
    <I18nProvider initialLanguage={prefs.language} onChange={rememberLanguage}>
      <TextSizeProvider initialStep={prefs.textSizeStep} onChange={rememberTextSize}>
        <BrowserRouter basename={BASE_PATH}>
          <AppRoutes />
        </BrowserRouter>
      </TextSizeProvider>
    </I18nProvider>
  );
}
