import { ReactNode } from "react";

export interface PaymentRequest {
  recipient_phone: string;
  sender_phone: string;
  sender: ReactNode;
  created_at: any;
  payment_method: string;
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
  recipient_phone: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}