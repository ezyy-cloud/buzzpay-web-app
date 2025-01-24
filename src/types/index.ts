export interface NewPaymentRequest {
  recipient: string;
  amount: number;
  description: string;
  sender: string;
  sender_phone: string;
  recipient_phone: string;
}

export interface PaymentRequest extends NewPaymentRequest {
  id: string;
  status: 'pending' | 'paid' | 'cancelled';
  user_id: string;
  created_at: string;
}
