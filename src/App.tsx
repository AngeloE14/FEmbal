/**
 * Componente raíz de la aplicación.
 *
 * Su trabajo principal es declarar los \"límites\" globales:
 * en este caso, envolver todo con el provider de calculadora.
 */

import { CalculatorProvider } from './hooks/useCalculatorContext';
import { I18nProvider } from './hooks/useI18n';
import { HomePage } from './pages/HomePage';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdateToast } from './components/UpdateToast';
import { WhatsNewToast } from './components/WhatsNewToast';

function App() {
  return (
    <I18nProvider>
      <CalculatorProvider>
        <HomePage />
        <InstallPrompt />
        <UpdateToast />
        <WhatsNewToast />
      </CalculatorProvider>
    </I18nProvider>
  );
}

export default App;
