import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaSpinner, FaCrown, FaCreditCard, FaCog } from 'react-icons/fa';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscriptionStatus, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId && user) {
      // Refresh subscription status after successful payment
      refreshSubscriptionStatus()
        .then(() => {
          setLoading(false);
          // Redirect to user portal after 3 seconds
          setTimeout(() => {
            navigate('/user');
          }, 3000);
        })
        .catch((err) => {
          console.error('Error refreshing subscription:', err);
          setError('Payment successful, but there was an error updating your account. Please contact support.');
          setLoading(false);
        });
    } else if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
    }
  }, [searchParams, user, refreshSubscriptionStatus, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/user')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your premium subscription has been activated. You now have unlimited access to all clinics and premium features.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <FaCrown className="text-yellow-500 mr-2" />
              <span className="font-semibold text-blue-900">Premium Member</span>
            </div>
            <p className="text-sm text-blue-700">Welcome to Rehab Connect Premium!</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/clinics')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Explore All Clinics
            </button>
            <button
              onClick={() => navigate('/user')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Go to Dashboard
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Redirecting to your dashboard in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimes className="text-gray-400 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Cancelled</h2>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/clinics')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Continue Browsing
            </button>
            <button
              onClick={() => navigate('/user')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionManagement = () => {
  const { user, subscriptionStatus, cancelSubscription, createPortalSession, refreshSubscriptionStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      refreshSubscriptionStatus();
    }
  }, [user, refreshSubscriptionStatus]);

  const handleManageBilling = async () => {
    setLoading(true);
    setError('');
    
    try {
      const session = await createPortalSession();
      window.location.href = session.url;
    } catch (err) {
      setError('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setCancelLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await cancelSubscription();
      setSuccess('Your subscription has been cancelled and will end at the end of your current billing period.');
      await refreshSubscriptionStatus();
    } catch (err) {
      setError('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!subscriptionStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
      </div>
    );
  }

  const { isPremium, status, currentPeriodEnd, plan } = subscriptionStatus;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Management</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {isPremium ? (
              <>
                <FaCrown className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Premium Subscription</h3>
                  <p className="text-gray-600">Status: {status}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Free Plan</h3>
                  <p className="text-gray-600">Limited access to 5 clinics</p>
                </div>
              </>
            )}
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPremium 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isPremium ? 'Active' : 'Free'}
          </div>
        </div>

        {isPremium && currentPeriodEnd && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Plan:</strong> {plan || 'Premium'} <br />
              <strong>Next billing date:</strong> {new Date(currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isPremium ? (
            <>
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
              >
                {loading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaCog className="mr-2" />
                )}
                Manage Billing
              </button>
              
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading || status === 'cancelled'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {cancelLoading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : null}
                {status === 'cancelled' ? 'Cancelled' : 'Cancel Subscription'}
              </button>
            </>
          ) : (
            <button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
              <FaCreditCard className="mr-2" />
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { PaymentSuccess, PaymentCancel, SubscriptionManagement };
