import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaymentRequest } from '../types';

export function RecipientView() {
  const { id } = useParams();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRequest(data);
      } catch (err) {
        setError('Payment request not found');
        console.error('Error loading payment request:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRequest();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center text-red-600">
        {error || 'Payment request not found'}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment Request</h2>
          <Clock className="w-6 h-6 text-yellow-500" />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Amount Due</p>
            <p className="text-3xl font-bold text-gray-900">${request.amount.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-900">{request.description}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Requested on</p>
            <p className="text-gray-900">{new Date(request.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <Link
          to={`/request/${id}/pay`}
          className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Proceed to Payment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}