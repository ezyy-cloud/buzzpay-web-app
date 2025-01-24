import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SendIcon } from 'lucide-react';
import { RecipientView } from './pages/RecipientView';
import { PaymentWall } from './pages/PaymentWall';
import { Receipt } from './pages/Receipt';
import { PaymentRequestCreation } from './pages/PaymentRequestCreation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SendIcon className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">BuzzPay</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/create" element={<PaymentRequestCreation />} />
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/request/:id" element={<RecipientView />} />
            <Route path="/request/:id/pay" element={<PaymentWall />} />
            <Route path="/request/:id/receipt" element={<Receipt />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;