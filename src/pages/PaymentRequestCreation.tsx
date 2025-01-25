import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewPaymentRequest } from '../types';
import PhoneInput, { 
  formatPhoneNumberIntl, 
  isValidPhoneNumber} from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useDarkMode } from '../context/DarkModeContext';
import { parsePhoneNumber as parsePhoneNumberLib } from 'libphonenumber-js';

export function PaymentRequestCreation() {
  const [sender, setSender] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Dark mode state
  useDarkMode();

  // Helper function to format and validate phone number
  const handlePhoneChange = (setter: (phone: string) => void) => (value: string | undefined) => {
    if (value) {
      try {
        // Ensure the phone number is in international format
        const formattedPhone = formatPhoneNumberIntl(value) || value;
        setter(formattedPhone);
      } catch (error) {
        console.error('Phone number formatting error:', error);
        setter(value);
      }
    } else {
      setter('');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    try {
      const phoneNumber = parsePhoneNumberLib(phone);
      return phoneNumber.number.toString().replace(/\D/g, '');
    } catch {
      return phone;
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0: // Sender Name
        return sender.trim().length > 1;
      case 1: // Sender Phone
        return senderPhone && senderPhone.length > 5 && isValidPhoneNumber(senderPhone);
      case 2: // Recipient Name
        return recipient.trim().length > 1;
      case 3: // Recipient Phone
        return recipientPhone && recipientPhone.length > 5 && isValidPhoneNumber(recipientPhone);
      case 4: // Amount
        return amount && parseFloat(amount) > 0;
      case 5: // Description
        // If last input is not visible, consider it valid
        return !isLastInputVisible || description.trim().length > 0;
      default:
        return false;
    }
  };

  const checkAllStepsValidity = () => {
    // If last input is not visible, exclude it from validation
    return [0, 1, 2, 3, 4, ...(isLastInputVisible ? [5] : [])].every(step => validateStep(step));
  };

  const [paymentRequestStatus, setPaymentRequestStatus] = useState<{
    success: boolean;
    message: string;
    shareLink?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate all steps before submission
    if (!checkAllStepsValidity()) {
      setError('Please complete all fields correctly');
      setLoading(false);
      return;
    }

    try {
      const newPaymentRequest: NewPaymentRequest & { status: 'pending' } = {
        amount: parseFloat(amount),
        description,
        recipient,
        sender,
        sender_phone: formatPhoneNumber(senderPhone),
        recipient_phone: formatPhoneNumber(recipientPhone),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('payment_requests')
        .insert(newPaymentRequest)
        .select()
        .single();

      if (error) throw error;

      // Generate shareable link
      const shareLink = `https://buzzpayme.netlify.app/request/${data.id}`;

      // Set payment request status
      setPaymentRequestStatus({
        success: true,
        message: `Payment request of $${amount} to ${recipient} created successfully!`,
        shareLink
      });

      // Construct WhatsApp message
      const whatsappMessage =
        `Hey ${recipient}\n` +
        `I just sent you a payment request for $${parseFloat(amount).toFixed(2)} for ${description}. ` +
        `Could you please take a look and complete the payment?\n\n` +
        `Click the link below to view the details:\n` +
        `${shareLink}\n\n` +
        `Thanks!\n\n`+
        `${sender}\n\n`+
        `Create your own payment request at https://buzzpayme.netlify.app/`;
      // Encode message for URL
      const encodedMessage = encodeURIComponent(whatsappMessage);

      // Attempt multiple methods to open WhatsApp
      const whatsappUrls = [
        `https://wa.me/${formatPhoneNumber(recipientPhone)}?text=${encodedMessage}`, // Most compatible
        `whatsapp://send?phone=${formatPhoneNumber(recipientPhone)}&text=${encodedMessage}`, // App-specific
      ];

      // Try opening WhatsApp
      let opened = false;
      for (const url of whatsappUrls) {
        try {
          window.open(url, '_blank');
          opened = true;
          break;
        } catch (err) {
          console.error(`Failed to open WhatsApp with URL: ${url}`, err);
        }
      }

      if (!opened) {
        // Fallback: copy to clipboard and show message
        await navigator.clipboard.writeText(whatsappMessage);
        setError('Could not open WhatsApp. Message copied to clipboard. Please paste in WhatsApp manually.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically progress to next step when current step is validated
    if (validateStep(currentStep)) {
      const timer = setTimeout(() => {
        if (currentStep < 6) {
          setCurrentStep(prev => prev + 1);
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // If current step becomes invalid, reset subsequent steps
      if (currentStep > 0) {
        setCurrentStep(prevStep => {
          // Find the last valid step
          for (let i = prevStep; i >= 0; i--) {
            if (!validateStep(i)) {
              return i;
            }
          }
          return 0;
        });
      }
    }
  }, [sender, senderPhone, recipient, recipientPhone, amount, description, currentStep]);

  // Add state for input timeout
  const [isLastInputVisible, setIsLastInputVisible] = useState(true);

  // Effect to handle input timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Only start timeout if we're on the last step and there's no input
    if (currentStep === 5 && description.trim() === '') {
      timeoutId = setTimeout(() => {
        setIsLastInputVisible(false);
      }, 10000);
    }

    // Reset visibility if description changes or we move to this step
    if (description.trim() !== '') {
      setIsLastInputVisible(true);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStep, description]);

  // Modify existing input handlers to update last input time
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    
    // Always show input when typing
    if (newDescription.trim() !== '') {
      setIsLastInputVisible(true);
    }
  };

  // Add state for tracking link copy
  const [linkCopied, setLinkCopied] = useState(false);

  // Function to handle link copying
  const handleCopyLink = () => {
    if (paymentRequestStatus?.shareLink) {
      navigator.clipboard.writeText(paymentRequestStatus.shareLink)
        .then(() => {
          setLinkCopied(true);
          // Reset copy state after 2 seconds
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy link', err);
        });
    }
  };

  const renderFormStep = () => {
    const formSteps = [
      {
        botMessage: "Hi there! What's your name?",
        input: (
          <input
            id="sender"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
              dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600
              ${sender.trim().length > 1 
                ? 'border-green-500 focus:border-green-500 dark:border-green-500' 
                : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
            placeholder="Enter your name"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
        ),
        isValid: sender.trim().length > 1
      },
      {
        botMessage: `Nice to meet you, ${sender || 'there'}! What's your phone number?`,
        input: (
          <PhoneInput
            international
            withCountryCallingCode
            defaultCountry="ZW"
            countries={['ZA', 'US', 'GB', 'AU', 'CA', 'ZW', 'NG']}
            value={senderPhone}
            onChange={handlePhoneChange(setSenderPhone)}
            placeholder="Your phone number"
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
              dark:bg-gray-700 dark:border-gray-600 dark:text-black dark:focus:ring-purple-600 dark:focus:border-purple-600
              ${senderPhone && senderPhone.length > 5 && isValidPhoneNumber(senderPhone)
                ? 'border-green-500 focus:border-green-500 dark:border-green-500'
                : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
            countrySelectProps={{
              className: 'custom-country-select',
            }}
          />
        ),
        isValid: senderPhone && senderPhone.length > 5 && isValidPhoneNumber(senderPhone)
      },
      {
        botMessage: "Who are you requesting money from?",
        input: (
          <input
            id="recipient"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
              dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600
              ${recipient.trim().length > 1 
                ? 'border-green-500 focus:border-green-500 dark:border-green-500' 
                : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
            placeholder="Enter recipient's name"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        ),
        isValid: recipient.trim().length > 1
      },
      {
        botMessage: `Got it! What's ${recipient || "their"}'s phone number?`,
        input: (
          <PhoneInput
            international
            withCountryCallingCode
            defaultCountry="ZW"
            countries={['ZA', 'US', 'GB', 'AU', 'CA', 'ZW', 'NG']}
            value={recipientPhone}
            onChange={handlePhoneChange(setRecipientPhone)}
            placeholder="Recipient's phone number"
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
              dark:bg-gray-700 dark:border-gray-600 dark:text-black dark:focus:ring-purple-600 dark:focus:border-purple-600
              ${recipientPhone && recipientPhone.length > 5 && isValidPhoneNumber(recipientPhone)
                ? 'border-green-500 focus:border-green-500 dark:border-green-500'
                : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
            countrySelectProps={{
              className: 'custom-country-select',
            }}
          />
        ),
        isValid: recipientPhone && recipientPhone.length > 5 && isValidPhoneNumber(recipientPhone)
      },
      {
        botMessage: "How much money do you want to request?",
        input: (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-300">$</span>
            </div>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 pl-7 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
                dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600
                ${amount && parseFloat(amount) > 0
                  ? 'border-green-500 focus:border-green-500 dark:border-green-500'
                  : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        ),
        isValid: amount && parseFloat(amount) > 0
      },
      {
        botMessage: "What's this payment for?",
        input: (
          <input
            id="description"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-base 
              dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600
              ${description.trim().length > 0 
                ? 'border-green-500 focus:border-green-500 dark:border-green-500' 
                : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'}`}
            placeholder="Enter payment description"
            value={description}
            onChange={handleDescriptionChange}
          />
        ),
        isValid: description.trim().length > 0
      }
    ];

    return formSteps.map((step, index) => {
      // Completely hide the last step if not visible and not the current step
      if (index === formSteps.length - 1 && !isLastInputVisible && currentStep < index) {
        return null;
      }

      return (
        <div
          key={index}
          className={`transition-all duration-500 ease-in-out transform 
            ${index <= currentStep
              ? 'opacity-100 translate-y-0 h-auto'
              : 'opacity-0 translate-y-10 h-0 overflow-hidden'}
            mobile:mb-4 space-y-2 
            ${index === formSteps.length - 1 && !isLastInputVisible ? 'hidden' : ''}`}
        >
          {/* Bot Message */}
          <div className="flex items-start mb-2">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-lg max-w-[80%] shadow-sm">
              {step.botMessage}
            </div>
          </div>

          {/* User Response */}
          {index <= currentStep && (
            <div className="flex justify-end items-start mb-2">
              <div className="bg-purple-500 text-white p-3 rounded-lg max-w-[80%] shadow-sm">
                {index === 0 && sender}
                {index === 1 && senderPhone}
                {index === 2 && recipient}
                {index === 3 && recipientPhone}
                {index === 4 && `$${amount}`}
                {index === 5 && description}
              </div>
            </div>
          )}

          {/* Input Field */}
          {index === currentStep && isLastInputVisible && (
            <div className="mt-2">
              {step.input}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 md:justify-center px-4 sm:px-6 lg:px-8 pt-24">
      <div className="w-full max-w-md mx-auto md:bg-white md:dark:bg-gray-800 md:shadow-lg md:rounded-xl md:p-8 
                      mobile:fixed mobile:inset-0 mobile:bg-white mobile:dark:bg-gray-900 mobile:p-0 mobile:pt-24 
                      mobile:overflow-y-auto">
        <div className="mb-6 mobile:sticky mobile:z-10 mobile:bg-white mobile:dark:bg-gray-900 mobile:pb-4 
                     md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800 md:pb-4 md:shadow-sm">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white 
                         mobile:text-2xl mobile:pt-4 
                         md:text-3xl md:pt-4">
            Create Payment Request
          </h2>
        </div>
        <form 
          className="space-y-6 mobile:flex mobile:flex-col mobile:space-y-2 mobile:pb-24 mobile:pt-8 
                     md:grid md:grid-cols-1 md:gap-6 
                     bg-white dark:bg-gray-800 mobile:px-4 md:p-4 rounded-lg shadow-sm" 
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-6 mobile:flex-grow mobile:pr-2 mobile:gap-2">
            {renderFormStep()}
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center mt-4 mobile:fixed mobile:bottom-20 mobile:left-0 mobile:right-0 mobile:px-4
                            md:fixed md:top-20 md:left-0 md:right-0 md:px-4 md:z-50">
              {error}
            </div>
          )}
          {description.trim().length > 0 && !paymentRequestStatus && (
            <div className="pt-4 transition-all duration-500 ease-in-out transform 
                            opacity-100 translate-y-0 
                            mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:p-4 mobile:bg-white mobile:dark:bg-gray-900 mobile:shadow-2xl">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Create Payment Request'}
              </button>
            </div>
          )}
          {paymentRequestStatus && (
            <div className="pt-4 transition-all duration-500 ease-in-out transform 
                            opacity-100 translate-y-0 
                            mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:p-4 mobile:bg-white mobile:dark:bg-gray-900 mobile:shadow-2xl">
              <div className="w-full py-3 px-4 bg-green-100 text-green-800 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{paymentRequestStatus.message}</span>
                </div>
                {paymentRequestStatus.shareLink && (
                  <button 
                    onClick={handleCopyLink}
                    className={`ml-2 text-green-600 hover:text-green-800 ${linkCopied ? 'text-green-400' : ''}`}
                    aria-label="Copy payment link"
                    type='button'
                  >
                    {linkCopied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
