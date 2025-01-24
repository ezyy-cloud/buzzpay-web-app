-- Add sender and recipient phone columns to payment_requests table
ALTER TABLE payment_requests 
ADD COLUMN sender TEXT DEFAULT 'Unknown Sender',
ADD COLUMN sender_phone TEXT DEFAULT 'Unknown',
ADD COLUMN recipient_phone TEXT DEFAULT 'Unknown';

-- Update existing rows with default values
UPDATE payment_requests 
SET 
  sender = COALESCE(sender, 'Unknown Sender'),
  sender_phone = COALESCE(sender_phone, 'Unknown'),
  recipient_phone = COALESCE(recipient_phone, 'Unknown');

-- Now set the columns to NOT NULL
ALTER TABLE payment_requests 
ALTER COLUMN sender SET NOT NULL,
ALTER COLUMN sender_phone SET NOT NULL,
ALTER COLUMN recipient_phone SET NOT NULL;
