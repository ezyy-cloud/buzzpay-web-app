import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewPaymentRequest } from '../types';
import PhoneInput from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';
import { parsePhoneNumber } from 'libphonenumber-js';

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

  const formatPhoneNumber = (phone: string) => {
    try {
      const phoneNumber = parsePhoneNumber(phone);
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
        return senderPhone && senderPhone.length > 5;
      case 2: // Recipient Name
        return recipient.trim().length > 1;
      case 3: // Recipient Phone
        return recipientPhone && recipientPhone.length > 5;
      case 4: // Amount
        return amount && parseFloat(amount) > 0;
      case 5: // Description
        return description.trim().length > 0;
      default:
        return false;
    }
  };

  const checkAllStepsValidity = () => {
    return [0, 1, 2, 3, 4, 5].every(step => validateStep(step));
  };

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
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('payment_requests')
        .insert(newPaymentRequest)
        .select()
        .single();

      if (error) throw error;

      // Generate shareable link
      const shareLink = `https://buzzpay.co/request/${data.id}`;

      // Construct WhatsApp message
      const whatsappMessage =
        `Payment Request from BuzzPay\n` +
        `Sender: ${sender} (${formatPhoneNumber(senderPhone)})\n` +
        `Recipient: ${recipient}\n` +
        `Amount: $${parseFloat(amount).toFixed(2)}\n` +
        `Description: ${description}\n` +
        `Pay here: ${shareLink}`;

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
        if (currentStep < 5) {
          setCurrentStep(prev => prev + 1);
        }
      }, 500);
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

  const renderFormStep = () => {
    const formSteps = [
      {
        label: "Your Name",
        input: (
          <input
            id="sender"
            name="sender"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
              ${sender.trim().length > 1
                ? 'border-green-500 focus:border-green-500'
                : 'border-gray-300 focus:border-indigo-500'}`}
            placeholder="Enter your name"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
        ),
        isValid: sender.trim().length > 1
      },
      {
        label: "Your Phone Number",
        input: (
          <PhoneInput
            international
            withCountryCallingCode
            value={senderPhone}
            onChange={(value) => setSenderPhone(value || '')}
            placeholder="Sender Phone Number"
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
              ${senderPhone && senderPhone.length > 5
                ? 'border-green-500 focus:border-green-500'
                : 'border-gray-300 focus:border-indigo-500'}`}
          />
        ),
        isValid: senderPhone && senderPhone.length > 5
      },
      {
        label: "Recipient Name",
        input: (
          <input
            id="recipient"
            name="recipient"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
              ${recipient.trim().length > 1
                ? 'border-green-500 focus:border-green-500'
                : 'border-gray-300 focus:border-indigo-500'}`}
            placeholder="Enter recipient's name"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        ),
        isValid: recipient.trim().length > 1
      },
      {
        label: "Recipient Phone Number",
        input: (
          <PhoneInput
            international
            withCountryCallingCode
            placeholder="Enter recipient's phone number"
            value={recipientPhone}
            onChange={(value: string | undefined) => setRecipientPhone(value || '')}
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
              ${recipientPhone && recipientPhone.length > 5
                ? 'border-green-500 focus:border-green-500'
                : 'border-gray-300 focus:border-indigo-500'}`}
          />
        ),
        isValid: recipientPhone && recipientPhone.length > 5
      },
      {
        label: "Amount",
        input: (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-base">$</span>
            </div>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 pl-7 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
                ${amount && parseFloat(amount) > 0
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:border-indigo-500'}`}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        ),
        isValid: amount && parseFloat(amount) > 0
      },
      {
        label: "Description",
        input: (
          <input
            id="description"
            name="description"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base 
              ${description.trim().length > 0
                ? 'border-green-500 focus:border-green-500'
                : 'border-gray-300 focus:border-indigo-500'}`}
            placeholder="Enter payment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        ),
        isValid: description.trim().length > 0
      }
    ];

    return formSteps.map((step, index) => (
      <div
        key={index}
        className={`transition-all duration-500 ease-in-out transform 
          ${index <= currentStep
            ? 'opacity-100 translate-y-0 h-auto'
            : 'opacity-0 translate-y-10 h-0 overflow-hidden'}
          mobile:mb-4`}
      >
        <label
          htmlFor={index === 0 ? 'sender' : index === 1 ? 'senderPhone' :
            index === 2 ? 'recipient' : index === 3 ? 'recipientPhone' :
              index === 4 ? 'amount' : 'description'}
          className="block text-sm font-medium text-gray-700 mobile:mb-2 mobile:text-sm"
        >
          {step.label}
        </label>
        {step.input}
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:justify-center px-4 sm:px-6 lg:px-8 pt-24">
      <div className="w-full max-w-md mx-auto md:bg-white md:shadow-lg md:rounded-xl md:p-8 
                      mobile:fixed mobile:inset-0 mobile:bg-white mobile:p-6 mobile:pt-24 
                      mobile:overflow-y-auto">
        <div className="mb-6 mobile:sticky mobile:top-0 mobile:z-10 mobile:bg-white mobile:pb-4 
                     md:sticky md:top-0 md:z-10 md:bg-white md:pb-4 md:shadow-sm">
          <h2 className="text-center text-3xl font-bold text-gray-900 
                         mobile:text-2xl mobile:pt-4 
                         md:text-3xl md:pt-4">
            Create Payment Request
          </h2>
        </div>
        <form className="space-y-6 mobile:flex mobile:flex-col mobile:space-y-2 mobile:pb-24" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mobile:flex-grow mobile:pr-2 mobile:gap-2">
            {renderFormStep()}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mt-4 mobile:fixed mobile:bottom-20 mobile:left-0 mobile:right-0 mobile:px-4
                            md:fixed md:top-20 md:left-0 md:right-0 md:px-4 md:z-50">
              {error}
            </div>
          )}

          {description.trim().length > 0 && (
            <div className="pt-4 transition-all duration-500 ease-in-out transform 
                            opacity-100 translate-y-0 
                            mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:p-4 mobile:bg-white mobile:shadow-2xl">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
              >
                {loading ? 'Sending...' : 'Create and Share Request'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
