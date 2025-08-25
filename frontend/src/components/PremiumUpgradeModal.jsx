import React, { useState } from 'react';
import { FaTimes, FaCrown, FaCheck, FaShieldAlt, FaHeart, FaPhone, FaCreditCard } from 'react-icons/fa';

const PremiumUpgradeModal = ({ isOpen, onClose, onUpgrade, loading = false }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Premium',
      price: 299,
      originalPrice: 399,
      duration: '1 Month',
      savings: '25% OFF',
      features: [
        'Unlimited clinic access',
        'Priority customer support',
        'Advanced search filters',
        'Detailed clinic information',
        'Direct contact details',
        'Review & rating system',
        'Favorite clinics list',
        'No advertisements'
      ],
      recommended: false
    },
    quarterly: {
      id: 'quarterly',
      name: 'Quarterly Premium',
      price: 699,
      originalPrice: 1197,
      duration: '3 Months',
      savings: '42% OFF',
      features: [
        'All Monthly Premium features',
        'Extended clinic database',
        'Priority appointment booking',
        'Health progress tracking',
        'Exclusive wellness content',
        'Telehealth consultations',
        '24/7 support hotline',
        'Family account sharing'
      ],
      recommended: true
    },
    yearly: {
      id: 'yearly',
      name: 'Yearly Premium',
      price: 1999,
      originalPrice: 4788,
      duration: '12 Months',
      savings: '58% OFF',
      features: [
        'All Quarterly Premium features',
        'Unlimited family members',
        'Personal health assistant',
        'Annual health checkup discount',
        'Insurance claim assistance',
        'Medical record storage',
        'Emergency consultation',
        'Cashback on treatments'
      ],
      recommended: false
    }
  };

  const handleUpgrade = () => {
    const plan = plans[selectedPlan];
    onUpgrade(plan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaCrown className="text-yellow-300 text-2xl" />
              <h2 className="text-3xl font-bold">Upgrade to Premium</h2>
            </div>
            <p className="text-blue-100">
              Unlock premium features and get unlimited access to all clinics
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.values(plans).map((plan) => (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.recommended ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-gray-500 text-sm mb-2">{plan.duration}</div>
                  
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 line-through ml-2">₹{plan.originalPrice}</span>
                  </div>
                  
                  <div className="text-green-600 font-semibold text-sm">
                    {plan.savings}
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FaCheck className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <div className="text-blue-600 text-sm font-medium">
                      +{plan.features.length - 4} more features
                    </div>
                  )}
                </div>

                <div className={`mt-4 w-6 h-6 rounded-full border-2 mx-auto ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === plan.id && (
                    <FaCheck className="text-white text-xs m-1" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Why Choose Premium?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaShieldAlt className="text-blue-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Verified Quality</h4>
                <p className="text-gray-600 text-sm">
                  Access to verified, high-quality healthcare providers
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaHeart className="text-green-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Priority Care</h4>
                <p className="text-gray-600 text-sm">
                  Get priority support and faster appointment booking
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaPhone className="text-purple-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-sm">
                  Round-the-clock customer support for all your needs
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaCreditCard />
                  <span>Upgrade Now - ₹{plans[selectedPlan].price}</span>
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <FaShieldAlt className="inline mr-1" />
            Secure payment powered by Razorpay • 100% safe & encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;
