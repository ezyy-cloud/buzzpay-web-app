// Utility function to format phone numbers
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if the number is valid
  if (cleaned.length === 10) {
    // US phone number format: (123) 456-7890
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Number starts with 1, remove the leading 1
    return `+1${cleaned.slice(1)}`;
  } else if (cleaned.length > 10) {
    // If number is longer, assume it includes country code
    return `+${cleaned}`;
  }
  
  // If number is too short, return as is
  return phoneNumber;
}
