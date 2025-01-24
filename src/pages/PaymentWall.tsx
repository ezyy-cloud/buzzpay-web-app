import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types';

export function PaymentWall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', name: 'Credit Card', icon: 'CreditCard' },
    { id: 'mobile', name: 'Mobile Money', icon: 'Smartphone' },
    { id: 'bank', name: 'Bank Transfer', icon: 'Building2' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-6 h-6" />;
      case 'Smartphone':
        return <Smartphone className="w-6 h-6" />;
      case 'Building2':
        return <Building2 className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          payment_method: selectedMethod,
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      navigate(`/request/${id}/receipt`);
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Payment Method</h2>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className={`${
                selectedMethod === method.id ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {getIcon(method.icon)}
              </div>
              <span className="font-medium text-gray-900">{method.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}