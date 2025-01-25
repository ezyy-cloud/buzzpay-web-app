import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Download, Send, AlertCircle, XCircle } from 'lucide-react';
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

  const getStatusDetails = () => {
    switch (request?.status) {
      case 'paid':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-300" />,
          heading: 'Payment Successful',
          iconBg: 'bg-green-100 dark:bg-green-900'
        };
      case 'pending':
        return {
          icon: <AlertCircle className="w-8 h-8 text-yellow-500 dark:text-yellow-300" />,
          heading: 'Payment Pending',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500 dark:text-red-300" />,
          heading: 'Payment Cancelled',
          iconBg: 'bg-red-100 dark:bg-red-900'
        };
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-500 dark:text-gray-300" />,
          heading: 'Payment in process',
          iconBg: 'bg-gray-100 dark:bg-gray-900'
        };
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

  const { icon, heading, iconBg } = getStatusDetails();

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className={`${iconBg} rounded-full p-3`}>
              {icon}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            {heading}
          </h2>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Date Created</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Not Available'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Recipient</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {request.recipient}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Description</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {request.description}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">${request.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {request.status}
              </span>
            </div>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {request.payment_method || 'Not Specified'}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
            <span className="font-medium text-gray-900 dark:text-white">{request.id}</span>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Write a note..."
            />
            <button
              onClick={handleAddNote}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}