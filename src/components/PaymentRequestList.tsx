import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PaymentRequest } from '../types';

interface Props {
  requests: PaymentRequest[];
}

export function PaymentRequestList({ requests }: Props) {
  const getStatusIcon = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold text-gray-800 p-6 border-b">Payment Requests</h2>
      
      <div className="divide-y divide-gray-200">
        {requests.map((request) => (
          <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(request.status)}
                <span className="font-medium text-gray-900">
                  ${request.amount.toFixed(2)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(request.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-gray-600 mb-2">{request.description}</p>
            
            <div className="text-sm text-gray-500">
              To: {request.recipient}
            </div>
          </div>
        ))}
        
        {requests.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No payment requests yet
          </div>
        )}
      </div>
    </div>
  );
}