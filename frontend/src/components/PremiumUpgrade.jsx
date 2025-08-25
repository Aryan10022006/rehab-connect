import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../utils/apiService';

const PremiumUpgrade = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [paymentError, setPaymentError] = useState(null);

  const plans = {
    premium: {
      name: 'Premium Monthly',
      price: '₹299',
      period: 'per month',
      amount: 29900,
      features: [
        'Unlimited clinic search results',
        'Advanced filtering options',
        'Direct contact information',
        'Priority customer support',
        'No advertisements'
      ]
    },
    annual: {
      name: 'Premium Annual',
      price: '₹2,999',
      period: 'per year',
      amount: 299900,
      save: '₹600',
      features: [
        'Everything in Premium Monthly',
        'Save ₹600 per year',
        'Extended support hours',
        'Early access to new features',
        'Premium badge on profile'
      ]
    }
  };

  const handlePremiumUpgrade = async () => {
    if (!currentUser) {
      setPaymentError('Please login to upgrade to premium');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Create order
      const orderResponse = await apiService.premium.createOrder(
        currentUser.uid,
        currentUser.email,
        selectedPlan
      );

      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'RoboBionics Healthcare',
        description: `Premium ${selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Plan`,
        order_id: orderResponse.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: currentUser.uid
            };

            const verifyResponse = await apiService.premium.verifyPayment(verificationData);
            
            if (verifyResponse.success) {
              onSuccess && onSuccess(verifyResponse);
              onClose();
              
              // Show success notification
              alert('🎉 Premium upgrade successful! You now have access to all premium features.');
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: currentUser.displayName || 'User',
          email: currentUser.email,
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Premium upgrade error:', error);
      setPaymentError(error.message || 'Failed to initiate premium upgrade');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
              <p className="text-emerald-100 mt-1">Unlock all features and get unlimited access</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(plans).map(([planKey, plan]) => (
              <div
                key={planKey}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === planKey
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedPlan(planKey)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-3xl font-bold text-emerald-600">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    {plan.save && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-medium mt-2 inline-block">
                        Save {plan.save}
                      </span>
                    )}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    selectedPlan === planKey
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === planKey && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700">{paymentError}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePremiumUpgrade}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to {plans[selectedPlan].name}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-blue-700 text-sm">
                <strong>Secure Payment:</strong> Your payment information is processed securely through Razorpay. 
                We never store your payment details.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;
