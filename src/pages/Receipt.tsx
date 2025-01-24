import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Download, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaymentRequest } from '../types';

export function Receipt() {
  const { id } = useParams();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [note, setNote] = useState('');
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
        if (data.note) setNote(data.note);
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

  const handleAddNote = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ note })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

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
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Payment Successful
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-medium">${request.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium">{request.paymentMethod}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {new Date(request.paymentDate || '').toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-medium">{request.id}</span>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Write a note..."
            />
            <button
              onClick={handleAddNote}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}