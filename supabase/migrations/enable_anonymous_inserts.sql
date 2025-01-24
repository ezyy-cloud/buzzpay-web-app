-- Enable anonymous insertions for payment_requests table
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert new payment requests
CREATE POLICY "Allow anonymous payment request creation" 
ON payment_requests 
FOR INSERT 
WITH CHECK (true);
