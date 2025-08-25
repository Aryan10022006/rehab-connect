import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCheck, FaTimes, FaSpinner, FaCreditCard, FaShieldAlt } from 'react-icons/fa';

const PRICING_PLANS = {
  premium_monthly: {
    id: 'price_premium_monthly', // Replace with actual Stripe price ID
    name: 'Premium Monthly',
    price: '₹299',
    interval: 'month',
    features: [
      'Unlimited clinic access',
      'Advanced search filters',
      'Priority support',
      'Detailed clinic reviews',
      'Save unlimited favorites',
      'Export clinic data',
      'Mobile app access'
    ]
  },
  premium_yearly: {
    id: 'price_premium_yearly', // Replace with actual Stripe price ID
    name: 'Premium Yearly',
    price: '₹2,870',
    originalPrice: '₹3,588',
    interval: 'year',
    discount: '20% OFF',
    features: [
      'All Premium Monthly features',
      '20% annual discount',
      'Priority phone support',
      'Early access to new features',
      'Custom clinic recommendations',
      'API access for developers'
    ]
  }
};

const PricingModal = ({ isOpen, onClose, preselectedPlan = null }) => {
  const { createCheckoutSession, user, subscriptionStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || 'premium_monthly');
  const [error, setError] = useState('');

  const handleSubscribe = async (planId) => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const plan = PRICING_PLANS[planId];
      const session = await createCheckoutSession(plan.id);
      
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to start subscription process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCurrentlyPremium = subscriptionStatus?.isPremium;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Unlock unlimited access to all clinics and premium features</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isCurrentlyPremium && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <FaCheck className="mr-2" />
              You already have an active premium subscription
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`border-2 rounded-xl p-6 relative cursor-pointer transition-all ${
                  selectedPlan === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${key === 'premium_yearly' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                {key === 'premium_yearly' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <FaCrown className="text-yellow-500 text-xl" />
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.interval}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="flex items-center mt-1">
                      <span className="text-gray-400 line-through text-sm">{plan.originalPrice}</span>
                      <span className="text-green-600 text-sm font-semibold ml-2">{plan.discount}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(key)}
                  disabled={loading || isCurrentlyPremium}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${
                    selectedPlan === key
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${
                    (loading || isCurrentlyPremium) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading && selectedPlan === key ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isCurrentlyPremium ? (
                    'Current Plan'
                  ) : (
                    <>
                      <FaCreditCard className="mr-2" />
                      Select Plan
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <FaShieldAlt className="text-gray-400 mt-1 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
                <p className="text-sm text-gray-600">
                  Your payment information is encrypted and secure. We use Stripe for payment processing,
                  which is trusted by millions of businesses worldwide. You can cancel anytime.
                </p>
              </div>
            </div>
          </div>

          {!user && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-center">
                Please <button onClick={onClose} className="font-semibold underline">log in</button> to subscribe to premium plans.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
