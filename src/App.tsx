import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';

import { Request } from './pages/Request';
import { PaymentWall } from './pages/PaymentWall';
import { Receipt } from './pages/Receipt';
import { PaymentRequestCreation } from './pages/PaymentRequestCreation';

function AppContent() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-6 sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PaperAirplaneIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BuzzPay</h1>
            </div>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707-1.414-1.414" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <Routes>
          <Route path="/create" element={<PaymentRequestCreation />} />
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/request/:id" element={<Request />} />
          <Route path="/request/:id/pay" element={<PaymentWall />} />
          <Route path="/request/:id/receipt" element={<Receipt />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AppContent />
      </Router>
    </DarkModeProvider>
  );
}

export default App;