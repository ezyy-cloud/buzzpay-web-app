-- Drop the foreign key constraint
ALTER TABLE payment_requests 
DROP CONSTRAINT IF EXISTS payment_requests_user_id_fkey;

-- Modify the user_id column to allow null values
ALTER TABLE payment_requests 
ALTER COLUMN user_id DROP NOT NULL;

-- Create a new constraint that allows null or non-empty user_id
ALTER TABLE payment_requests 
ADD CONSTRAINT nullable_user_id 
CHECK (user_id IS NULL OR user_id != '00000000-0000-0000-0000-000000000000'::uuid);

-- Create a policy to allow inserting rows with or without a user_id
CREATE POLICY "Allow inserting payment requests with optional user_id"
ON payment_requests
FOR INSERT
WITH CHECK (true);
