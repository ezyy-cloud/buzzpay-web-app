import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types';
import { useDarkMode } from '../context/DarkModeContext';
import { CustomModal } from '../components/CustomModal';

export function PaymentWall() {
  // Dark mode
  useDarkMode();

  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ussdCode, setUssdCode] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    { id: 'econet', name: 'Ecocash', icon: 'Smartphone' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch the full payment request details
      const { data: requestData, error: fetchError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', id)
        .single();

      // If payment is already paid, navigate to receipt
      if (requestData.status === 'paid') {
        navigate(`/request/${id}/receipt`);
        return;
      }

      if (fetchError) throw fetchError;

      // Prepare update payload
      const updatePayload = {
        status: 'processing',
        payment_method: selectedMethod,
        payment_date: new Date().toISOString()
      };

      // Attempt to update
      const { error } = await supabase
        .from('payment_requests')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('Update error:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Switch case to handle different payment methods
      switch (selectedMethod) {
        case 'Ecocash':
          // Clean and format phone number (remove any non-digit characters)
          const cleanPhone = requestData.recipient_phone.replace(/\D/g, '');
          
          // Format the USSD code for Econet
          const newUssdCode = `*153*1*1*${cleanPhone}*${requestData.amount}#`;

          // Copy USSD code to clipboard
          await navigator.clipboard.writeText(newUssdCode);

          // Set USSD code and show confirmation modal
          setUssdCode(newUssdCode);
          setShowConfirmModal(true);
          break;
      }
    } catch (err) {
      console.error('Payment error:', err);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    // Optionally open phone dialer (works on mobile devices)
    window.location.href = `tel:${ussdCode}`;
    setShowConfirmModal(false);
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose Payment Method</h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.name)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors 
                ${selectedMethod === method.name
                  ? 'border-purple-500 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600'
                }`}
            >
              <div className={`${
                selectedMethod === method.name 
                  ? 'text-purple-500 dark:text-purple-400' 
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {getIcon(method.icon)}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 
            border border-transparent text-base font-medium rounded-md 
            text-white bg-purple-600 hover:bg-purple-700 
            dark:bg-purple-700 dark:hover:bg-purple-600 
            focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-purple-500 
            disabled:bg-gray-300 disabled:cursor-not-allowed 
            dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
        >
          {loading ? 'Processing...' : 'Make Payment'}
        </button>

        {showConfirmModal && (
          <CustomModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setLoading(false);
            }}
            onConfirm={handleConfirmPayment}
            type="confirm"
            title="Econet USSD Payment"
            message={`USSD Code: ${ussdCode} (copied to clipboard)

Payment Steps:
1. Open your phone's dialer
2. Dial the USSD code
3. Follow the on-screen instructions`}
            confirmText="Open Dialer"
            cancelText="Cancel"
          />
        )}

        {showErrorModal && (
          <CustomModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            type="alert"
            title="Payment Error"
            message="Unable to process payment. Please check your connection and try again."
            confirmText="Close"
          />
        )}
      </div>
    </div>
  );
}