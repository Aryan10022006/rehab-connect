import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { FaCheck, FaTimes, FaCrown, FaStar, FaMapMarkerAlt, FaEye, FaHeart, FaHistory, FaUsers, FaShieldAlt, FaHeadset } from 'react-icons/fa';

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const plans = {
    free: {
      name: 'Free Plan',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for occasional searches',
      features: [
        'View up to 3 clinics per search',
        'Basic search within 1km radius',
        'Limited to 5km maximum distance',
        'Basic clinic information',
        'Standard support'
      ],
      limitations: [
        'No extended radius searches',
        'Limited clinic visibility',
        'No priority support',
        'No advanced filters'
      ],
      buttonText: 'Current Plan',
      recommended: false
    },
    premium: {
      name: 'Premium Plan',
      price: { monthly: 199, yearly: 1999 },
      description: 'Unlimited access for serious healthcare seekers',
      features: [
        'Unlimited clinic views',
        'Extended search radius up to 20km',
        'Advanced filtering options',
        'Priority listing in search results',
        'Detailed clinic analytics',
        'Save unlimited favorites',
        'Advanced booking features',
        'Priority customer support',
        'No advertisements',
        'Premium badge'
      ],
      limitations: [],
      buttonText: 'Upgrade Now',
      recommended: true
    }
  };

  const handleSubscribe = async (planType) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planType === 'free') {
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Integrate with payment gateway (Stripe/Razorpay)
      console.log(`Subscribing to ${planType} plan with ${billingCycle} billing`);
      
      // For now, simulate the payment process
      setTimeout(() => {
        alert('Payment integration coming soon! You will be redirected to secure payment gateway.');
        setLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Subscription error:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `₹${price}`;
  };

  const getSavings = () => {
    const monthlyTotal = plans.premium.price.monthly * 12;
    const yearlySavings = monthlyTotal - plans.premium.price.yearly;
    return Math.round((yearlySavings / monthlyTotal) * 100);
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Healthcare Plan
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Get unlimited access to our comprehensive clinic network
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 bg-white/10 rounded-full p-2 max-w-xs mx-auto">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 font-semibold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-600 font-semibold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs px-2 py-1 rounded-full text-black font-bold">
                  {getSavings()}% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 relative">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plans.free.name}</h3>
                <p className="text-gray-600 mb-4">{plans.free.description}</p>
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(plans.free.price[billingCycle])}
                  <span className="text-lg font-normal text-gray-500">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-gray-900 text-lg">What's included:</h4>
                {plans.free.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                
                <h4 className="font-semibold text-gray-900 text-lg mt-6">Limitations:</h4>
                {plans.free.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FaTimes className="text-red-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-500">{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={true}
                className="w-full py-3 px-6 bg-gray-100 text-gray-500 rounded-lg font-semibold border border-gray-200"
              >
                {user && !user.isPremium ? 'Current Plan' : 'Free Forever'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-yellow-300 relative">
              {/* Recommended Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
                  <FaCrown className="text-sm" />
                  Recommended
                </div>
              </div>

              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plans.premium.name}</h3>
                <p className="text-gray-700 mb-4">{plans.premium.description}</p>
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(plans.premium.price[billingCycle])}
                  <span className="text-lg font-normal text-gray-600">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-green-600 font-semibold mt-2">
                    Save ₹{(plans.premium.price.monthly * 12) - plans.premium.price.yearly} per year!
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-gray-900 text-lg">Everything in Premium:</h4>
                {plans.premium.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe('premium')}
                disabled={loading || (user?.isPremium)}
                className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : user?.isPremium ? (
                  'Current Plan'
                ) : (
                  plans.premium.buttonText
                )}
              </button>
              
              {!user && (
                <p className="text-sm text-gray-600 text-center mt-3">
                  <button 
                    onClick={() => navigate('/login')} 
                    className="text-blue-600 hover:underline"
                  >
                    Sign in
                  </button> to get started
                </p>
              )}
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose Premium?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMapMarkerAlt className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Extended Reach</h3>
                <p className="text-gray-600">
                  Search up to 20km radius instead of being limited to 5km. Find more options for your healthcare needs.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEye className="text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Unlimited Views</h3>
                <p className="text-gray-600">
                  View unlimited clinics instead of just 3. Make informed decisions with complete information.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHeadset className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Priority Support</h3>
                <p className="text-gray-600">
                  Get priority customer support and faster response times for any queries or issues.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I switch between plans?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a money-back guarantee?
                </h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee for all premium subscriptions. No questions asked.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards, debit cards, UPI, and net banking through our secure payment partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
