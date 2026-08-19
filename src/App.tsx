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

function App() {
  return (
    <I18nProvider>
      <CalculatorProvider>
        <HomePage />
        <InstallPrompt />
      </CalculatorProvider>
    </I18nProvider>
  );
}

export default App;
