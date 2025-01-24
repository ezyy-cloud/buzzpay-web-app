/*
  # Payment Requests Schema

  1. New Tables
    - `payment_requests`
      - `id` (uuid, primary key)
      - `amount` (numeric, required)
      - `description` (text, required)
      - `recipient` (text, required)
      - `status` (text, required)
      - `created_at` (timestamptz)
      - `payment_method` (text)
      - `payment_date` (timestamptz)
      - `note` (text)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `payment_requests` table
    - Add policies for:
      - Create: Authenticated users can create payment requests
      - Read: Users can read their own requests or requests where they are the recipient
      - Update: Users can update their own requests
*/

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  payment_method text,
  payment_date timestamptz,
  note text,
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy for creating payment requests
CREATE POLICY "Users can create payment requests"
  ON payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for reading payment requests
CREATE POLICY "Users can read own requests or requests where they are recipient"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    recipient = auth.jwt()->>'phone'
  );

-- Policy for updating payment requests
CREATE POLICY "Users can update own requests"
  ON payment_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);