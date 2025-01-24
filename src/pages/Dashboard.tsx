import { useState, useEffect } from 'react';
import { PaymentRequestForm } from '../components/PaymentRequestForm';
import { PaymentRequestList } from '../components/PaymentRequestList';
import { supabase } from '../lib/supabase';
import { PaymentRequest, NewPaymentRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function Dashboard() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase load error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(error.message || 'Failed to load payment requests');
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading payment requests:', error);
      setError(error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while loading requests'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (newRequest: NewPaymentRequest) => {
    try {
      setError(null);
      
      // Validate input
      if (!newRequest.amount || newRequest.amount <= 0) {
        throw new Error('Invalid amount. Please enter a positive number.');
      }
      
      if (!newRequest.recipient || !newRequest.description) {
        throw new Error('Recipient and description are required.');
      }

      // Generate a unique identifier for anonymous requests
      const anonymousUserId = uuidv4();

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          ...newRequest,
          status: 'pending',
          user_id: anonymousUserId, // Use the generated UUID
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Provide more context for different error types
        if (error.code === '23503') {
          throw new Error('Unable to create request. There might be an issue with user identification.');
        }
        
        throw new Error(error.message || 'Failed to create payment request');
      }

      // Optimistically update the list
      setRequests(prevRequests => [data, ...prevRequests]);
    } catch (error) {
      console.error('Error creating payment request:', error);
      setError(error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while creating the request'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <PaymentRequestForm onSubmit={handleCreateRequest} />
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      <div>
        <PaymentRequestList requests={requests} />
      </div>
    </div>
  );
}