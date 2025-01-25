import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PaymentRequest } from '../types';
import { useDarkMode } from '../context/DarkModeContext';
import PhoneInput from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';

// Form step type definition
type FormStep = {
  botMessage: string;
  input?: React.ReactNode;
  validate: () => boolean;
  errorState?: boolean;
};

export function Request() {
  // Dark mode
  useDarkMode();

  const navigate = useNavigate();
  const { id } = useParams();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formSteps] = useState<FormStep[]>([
    {
      input: (
        <div className="relative">
          <PhoneInput
            value={recipientPhone}
            onChange={(value) => setRecipientPhone(value || '')}
            placeholder="Enter your phone number"
            className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            style={{
              input: {
                backgroundColor: 'transparent',
                border: 'none',
                color: 'inherit',
                width: '100%',
                padding: '0',
                fontSize: 'inherit'
              },
              country: {
                color: 'inherit'
              }
            }}
            inputProps={{
              className: "w-full px-0 py-0 text-gray-200 bg-transparent focus:outline-none"
            }} />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0v-3a1 1 0 112 0v3zm-1-8a1 1 0 00-1 1v1a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      ),
      validate: () => recipientPhone.trim().length > 0,
      botMessage: ''
    }
  ]);

  // Handle payment processing
  const handleProcessPayment = () => {
    if (request) {
      navigate(`/request/${request.id}/pay`);
    }
  };

  // Load payment request
  useEffect(() => {
    const loadRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRequest(data);
      } catch (err) {
        setError('Payment request not found');
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id]);

  // Validate phone number
  const handlePhoneVerification = async () => {
    if (!request) return;

    try {
      // Remove non-digit characters for comparison
      const cleanRecipientPhone = recipientPhone.replace(/\D/g, '');
      const cleanRequestRecipientPhone = (request.recipient_phone || '').replace(/\D/g, '');
      const cleanRequestSenderPhone = (request.sender_phone || '').replace(/\D/g, '');


      // Check if input matches recipient phone
      if (cleanRecipientPhone === cleanRequestRecipientPhone) {

        // Show payment details
        setPhoneVerified(true);
        return true;
      } 
      // Check if input matches sender phone
      else if (cleanRecipientPhone === cleanRequestSenderPhone) {
        // Navigate to receipt page
        navigate(`/request/${request.id}/receipt`);
        return true;
      } 
      // No match found
      else {
        console.groupEnd();

        // Reset phone input and show error
        setRecipientPhone('');
        alert('Phone number does not match. Please try again.');
        return false;
      }
    } catch (error) {
      alert('An error occurred during verification.');
      return false;
    }
  };

  // Proceed to next step

  // Validate current step
  const validateStep = (step: number) => {
    switch (step) {
      case 0: // Phone Number
        return recipientPhone && recipientPhone.length > 5;
      default:
        return true;
    }
  };

  // Automatically progress steps
  useEffect(() => {
    console.log('🚦 Step Validation Check', {
      currentStep,
      stepValidation: validateStep(currentStep)
    });

    // Automatically progress to next step when current step is validated
    if (validateStep(currentStep)) {
      const timer = setTimeout(() => {
        console.log('🔜 Progressing to Next Step', {
          fromStep: currentStep,
          toStep: currentStep + 1
        });
        
        if (currentStep < formSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, validateStep]);

  // Render form steps
  const renderFormStep = () => {
    console.log('🔄 Rendering Form Steps', {
      currentStep,
      totalSteps: formSteps.length,
      phoneVerified,
      formSteps: formSteps.map((step, index) => ({
        index,
        input: !!step.input,
        validate: step.validate.toString()
      }))
    });

    return formSteps.map((step, index) => {
      console.log(`🟢 Rendering Step ${index}`, {
        isCurrentStep: currentStep === index,
        hasInput: !!step.input,
        phoneVerified
      });

      return (
        <div
          key={index}
          className={`transition-all duration-500 ease-in-out transform 
            ${currentStep === index
              ? 'opacity-100 translate-y-0 h-auto'
              : 'opacity-0 translate-y-10 h-0 overflow-hidden'}
            mobile:mb-4 space-y-2`}
        >
          {/* Input Field */}
          {index === currentStep && step.input && (
            <div className="mt-2">
              {step.input}
            </div>
          )}

          {/* Next Step Button */}
          {index === currentStep && index === 0 && (
            <div className="mt-4">
              <button
                onClick={handlePhoneVerification}
                disabled={!validateStep(index)}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Number
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  // Render payment details after verification
  const renderPaymentDetails = () => {
    if (!request) return null;

    console.log('🧾 Payment Details Rendering', {
      status: request.status,
      recipientPhone: request.recipient_phone,
      inputPhone: recipientPhone
    });

    return (
      <div className="bg-gray-800 text-gray-200 p-6 rounded-lg mb-4 text-left">
        <p className="mb-4">
          Hey there,
        </p>

        <p className="mb-4">
          {request.sender} has sent you a payment request of ${request.amount.toFixed(2)} for {request.description}.
        </p>

        {request.status === 'paid' ? (
          <p className="text-yellow-400 font-bold">
            This payment request has already been paid.
          </p>
        ) : (
          <p className="mb-4">
            If this looks good to you, you can process the payment by clicking the button below.
          </p>
        )}

        <p>
          Thanks,<br />
          BuzzPay
        </p>

        {request.status !== 'paid' && (
          <div className="mt-8">
            <button
              onClick={handleProcessPayment}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Process Payment
            </button>
          </div>
        )}
      </div>
    );
  };

  // Loading or error states
  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="w-full max-w-md p-4 bg-red-100 text-red-800 rounded-md">
      <p className="text-lg font-semibold mb-2">Error</p>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-start pt-24 items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-200">
            Payment Request
          </h2>
        </div>

        {/* Phone Verification Form */}
        {!phoneVerified && renderFormStep()}

        {/* Payment Details */}
        {phoneVerified && renderPaymentDetails()}
      </div>
    </div>
  );
}