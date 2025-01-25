import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PaymentRequest } from '../types';
import { useDarkMode } from '../context/DarkModeContext';
import PhoneInput from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';
import { parsePhoneNumber } from 'libphonenumber-js';

// Form step type definition
type FormStep = {
  botMessage: string;
  input?: React.ReactNode;
  validate: () => boolean;
  errorState?: boolean;
};

export function RecipientView() {
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
  const [formSteps, setFormSteps] = useState<FormStep[]>([
    {
      botMessage: "Hi there! To view this payment request, please verify your phone number.",
      input: (
        <PhoneInput
          value={recipientPhone}
          onChange={(e) => {
            setRecipientPhone(e);
          }}
          placeholder="Enter your phone number"
          className="w-full p-2 border rounded-md"
        />
      ),
      validate: () => recipientPhone.trim().length > 0
    },
    {
      botMessage: "Great! Let me verify your number.",
      validate: () => phoneVerified
    },
    {
      botMessage: "Number verified! Here are the payment details.",
      validate: () => true
    },
    {
      botMessage: 'Payment details are ready. Would you like to proceed?',
      input: null,
      validate: () => true
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
        console.error('Error loading payment request:', err);
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
      const cleanRequestPhone = (request.recipient_phone || '').replace(/\D/g, '');

      console.clear(); // Clear previous logs
      console.group('Phone Verification');
      console.log('Input Phone:', cleanRecipientPhone);
      console.log('Stored Phone:', cleanRequestPhone);

      // First, try simple digit-based comparison
      if (cleanRecipientPhone === cleanRequestPhone) {
        console.log('✅ Verification Successful');
        console.groupEnd();

        // Update form steps to progress to next step
        setFormSteps(prevSteps => {
          const updatedSteps = [...prevSteps];
          updatedSteps[0] = {
            ...updatedSteps[0],
            botMessage: 'Number verified successfully!'
          };
          return updatedSteps;
        });

        // Automatically move to next step after a short delay
        setTimeout(() => {
          setCurrentStep(prevStep => prevStep + 1);
        }, 1000);

        return true;
      } else {
        console.log('❌ Verification Failed');
        console.groupEnd();

        // Number verification failed
        setFormSteps(prevSteps => {
          const updatedSteps = [...prevSteps];
          updatedSteps[0] = {
            ...updatedSteps[0],
            botMessage: 'Verification failed. Please check the number.',
            errorState: true
          };
          return updatedSteps;
        });

        return false;
      }
    } catch (error) {
      console.error('Phone Verification Error:', error);
      
      setFormSteps(prevSteps => {
        const updatedSteps = [...prevSteps];
        updatedSteps[0] = {
          ...updatedSteps[0],
          botMessage: 'An error occurred during verification.',
          errorState: true
        };
        return updatedSteps;
      });

      return false;
    }
  };

  // Proceed to next step
  const handleNextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Validate current step
  const validateStep = (step: number) => {
    switch (step) {
      case 0: // Phone Number
        return recipientPhone && recipientPhone.length > 5;
      case 1: // Phone Verification
        return phoneVerified;
      default:
        return true;
    }
  };

  // Automatically progress steps
  useEffect(() => {
    // Automatically progress to next step when current step is validated
    if (validateStep(currentStep)) {
      const timer = setTimeout(() => {
        if (currentStep < 3) {
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
  }, [recipientPhone, phoneVerified, currentStep]);

  // Render form steps
  const renderFormStep = () => {
    return formSteps.map((step, index) => {
      if (index > currentStep) return null;

      return (
        <div
          key={index}
          className={`transition-all duration-500 ease-in-out transform 
            ${currentStep === index
              ? 'opacity-100 translate-y-0 h-auto'
              : 'opacity-0 translate-y-10 h-0 overflow-hidden'}
            mobile:mb-4 space-y-2`}
        >
          {/* Bot Message */}
          <div className="flex items-start mb-2">
            <p className={`text-gray-700 dark:text-gray-300 text-base flex-grow ${step.errorState ? 'text-red-500' : ''}`}>
              {step.botMessage}
            </p>
          </div>

          {/* Input Field */}
          {index === currentStep && (
            <div className="mt-2">
              {step.input}
            </div>
          )}

          {/* Payment Details */}
          {index === currentStep && index === 1 && renderPaymentDetails(index)}

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
  const renderPaymentDetails = (index) => {
    if (!request || currentStep < 1) return null;

    // Ensure phone numbers match exactly before showing details
    const cleanRecipientPhone = recipientPhone.replace(/\D/g, '');
    const cleanRequestPhone = (request.recipient_phone || '').replace(/\D/g, '');
    
    if (cleanRecipientPhone !== cleanRequestPhone) return null;

    return (
      <div className="bg-gray-800 text-gray-200 p-6 rounded-lg mb-4 text-left">
        <p className="mb-4">
          Hey there,
        </p>

        <p className="mb-4">
          {request.sender} has sent you a payment request of ${request.amount.toFixed(2)} for {request.description}.
        </p>

        <p className="mb-4">
          If this looks good to you, you can process the payment by clicking the button below.
        </p>

        <p>
          Thanks,<br />
          BuzzPay
        </p>
        <div>
        {index === currentStep && index === 1 && (
            <div className="mt-4">
              <button
                onClick={handleProcessPayment}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Process Payment
              </button>
            </div>
          )}
          {index === currentStep && index === 3 && (
            <div className="mt-4">
              <button
                onClick={handleProcessPayment}
                disabled={!validateStep(index)}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Payment
              </button>
            </div>
          )}
        </div>
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
    <div className="min-h-screen flex flex-col justify-center items-center mobile:px-4">
      <div className="w-full max-w-md">
        {phoneVerified ? renderPaymentDetails() : renderFormStep()}
      </div>
    </div>
  );
}