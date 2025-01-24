-- Disable default policies
ALTER TABLE payment_requests DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous payment request creation" ON payment_requests;
DROP POLICY IF EXISTS "Allow public read access" ON payment_requests;

-- Enable Row Level Security
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert new payment requests
CREATE POLICY "Allow anonymous payment request creation" 
ON payment_requests 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow reading payment requests
CREATE POLICY "Allow public read access"
ON payment_requests
FOR SELECT
USING (true);

-- Optional: Policy to allow updates only to pending requests
CREATE POLICY "Allow updates to pending requests"
ON payment_requests
FOR UPDATE
USING (status = 'pending')
WITH CHECK (status = 'pending');
