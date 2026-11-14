import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { KitPage } from '../kit/KitPage';
import { TextSizeProvider } from './TextSizeProvider';

export function App() {
  return (
    <I18nProvider>
      <TextSizeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/kit" element={<KitPage />} />
            {/* /a and /b arrive with the shells. Until then everything lands on the kit. */}
            <Route path="*" element={<Navigate to="/kit" replace />} />
          </Routes>
        </BrowserRouter>
      </TextSizeProvider>
    </I18nProvider>
  );
}
