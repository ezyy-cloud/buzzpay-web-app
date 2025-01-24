export interface PaymentRequest {
  id: string;
  amount: number;
  description: string;
  recipient: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paymentMethod?: string;
  paymentDate?: string;
  note?: string;
}

export interface NewPaymentRequest {
  amount: number;
  description: string;
  recipient: string;
  sender: string;
  sender_phone: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}