import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ModernButton, ModernInput, LoadingSpinner, Toast } from './ModernUI';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentComponent = ({ 
  amount, 
  currency = 'USD',
  onSuccess, 
  onError,
  description = 'Healthcare Service Payment',
  customerInfo = {},
  preferredProvider = 'stripe' 
}) => {
  const [selectedProvider, setSelectedProvider] = useState(preferredProvider);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    // Check available payment providers
    fetch('/api/payments/providers')
      .then(res => res.json())
      .then(data => {
        setAvailableProviders(data.available || []);
        if (data.available.includes(preferredProvider)) {
          setSelectedProvider(preferredProvider);
        } else if (data.available.length > 0) {
          setSelectedProvider(data.available[0]);
        }
      })
      .catch(err => console.error('Failed to load payment providers:', err));
  }, [preferredProvider]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const renderPaymentForm = () => {
    switch (selectedProvider) {
      case 'stripe':
        return (
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              amount={amount}
              currency={currency}
              description={description}
              customerInfo={customerInfo}
              onSuccess={onSuccess}
              onError={onError}
              showToast={showToast}
              setLoading={setLoading}
            />
          </Elements>
        );
      case 'razorpay':
        return (
          <RazorpayPaymentForm
            amount={amount}
            currency={currency}
            description={description}
            customerInfo={customerInfo}
            onSuccess={onSuccess}
            onError={onError}
            showToast={showToast}
            setLoading={setLoading}
          />
        );
      case 'paypal':
        return (
          <PayPalPaymentForm
            amount={amount}
            currency={currency}
            description={description}
            customerInfo={customerInfo}
            onSuccess={onSuccess}
            onError={onError}
            showToast={showToast}
            setLoading={setLoading}
          />
        );
      default:
        return <div className="text-center text-gray-500">No payment providers available</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <div className="text-3xl font-bold text-blue-600">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
          }).format(amount)}
        </div>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      {availableProviders.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-1 gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`
                  p-3 border-2 rounded-xl text-left transition-all duration-200
                  ${selectedProvider === provider 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{provider}</span>
                  {provider === 'stripe' && <span className="text-xs text-gray-500">Credit/Debit Cards</span>}
                  {provider === 'razorpay' && <span className="text-xs text-gray-500">UPI, Cards, Net Banking</span>}
                  {provider === 'paypal' && <span className="text-xs text-gray-500">PayPal Wallet</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center mb-6">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Processing payment...</span>
        </div>
      )}

      {!loading && renderPaymentForm()}
    </div>
  );
};

const StripePaymentForm = ({ 
  amount, 
  currency, 
  description, 
  customerInfo, 
  onSuccess, 
  onError, 
  showToast,
  setLoading 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent
    fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata: { description }
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClientSecret(data.clientSecret);
        } else {
          showToast('Failed to initialize payment', 'error');
        }
      })
      .catch(err => {
        console.error('Payment initialization failed:', err);
        showToast('Payment initialization failed', 'error');
      });
  }, [amount, currency, description, showToast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: customerInfo.name || '',
          email: customerInfo.email || '',
        },
      }
    });

    setLoading(false);

    if (error) {
      showToast(error.message, 'error');
      onError(error);
    } else if (paymentIntent.status === 'succeeded') {
      showToast('Payment successful!', 'success');
      onSuccess({
        provider: 'stripe',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-xl">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <ModernButton
        type="submit"
        disabled={!stripe || !clientSecret}
        loading={false}
        className="w-full"
        size="lg"
      >
        Pay {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount)}
      </ModernButton>
    </form>
  );
};

const RazorpayPaymentForm = ({ 
  amount, 
  currency, 
  description, 
  customerInfo, 
  onSuccess, 
  onError,
  showToast,
  setLoading 
}) => {
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createOrder = async () => {
    try {
      const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `receipt_${Date.now()}`,
          notes: { description }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.orderId;
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      showToast('Failed to create order', 'error');
      return null;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    const orderId = await createOrder();
    
    if (!orderId) {
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: amount * 100, // Convert to paise
      currency: currency,
      name: 'RehabConnect',
      description: description,
      order_id: orderId,
      prefill: {
        name: customerInfo.name || '',
        email: customerInfo.email || '',
        contact: customerInfo.phone || ''
      },
      theme: {
        color: '#2563eb'
      },
      handler: async function (response) {
        try {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            }),
          });

          const verifyData = await verifyResponse.json();
          
          if (verifyData.success && verifyData.verified) {
            showToast('Payment successful!', 'success');
            onSuccess({
              provider: 'razorpay',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: verifyData.amount,
              currency: verifyData.currency
            });
          } else {
            showToast('Payment verification failed', 'error');
            onError(new Error('Payment verification failed'));
          }
        } catch (error) {
          showToast('Payment verification failed', 'error');
          onError(error);
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          showToast('Payment cancelled', 'warning');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Pay securely with UPI, Credit/Debit Cards, Net Banking, and Wallets
      </div>
      
      <ModernButton
        onClick={handlePayment}
        className="w-full"
        size="lg"
      >
        Pay with Razorpay
      </ModernButton>
    </div>
  );
};

const PayPalPaymentForm = ({ 
  amount, 
  currency, 
  description, 
  customerInfo, 
  onSuccess, 
  onError,
  showToast,
  setLoading 
}) => {
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    // Load PayPal SDK
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=${currency}`;
    script.onload = () => setPaypalLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [currency]);

  useEffect(() => {
    if (paypalLoaded && window.paypal) {
      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await fetch('/api/payments/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount,
                currency,
                description
              }),
            });

            const data = await response.json();
            
            if (data.success) {
              return data.orderId;
            } else {
              throw new Error('Failed to create PayPal order');
            }
          } catch (error) {
            showToast('Failed to create PayPal order', 'error');
            onError(error);
          }
        },
        onApprove: async (data) => {
          setLoading(true);
          try {
            const response = await fetch('/api/payments/paypal/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderID
              }),
            });

            const captureData = await response.json();
            
            if (captureData.success) {
              showToast('Payment successful!', 'success');
              onSuccess({
                provider: 'paypal',
                orderId: data.orderID,
                amount: captureData.amount,
                currency: captureData.currency
              });
            } else {
              throw new Error('Failed to capture PayPal payment');
            }
          } catch (error) {
            showToast('Payment capture failed', 'error');
            onError(error);
          } finally {
            setLoading(false);
          }
        },
        onError: (error) => {
          showToast('PayPal payment error', 'error');
          onError(error);
          setLoading(false);
        },
        onCancel: () => {
          showToast('Payment cancelled', 'warning');
          setLoading(false);
        }
      }).render('#paypal-button-container');
    }
  }, [paypalLoaded, amount, currency, description, onSuccess, onError, showToast, setLoading]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Pay securely with your PayPal account or credit card
      </div>
      
      {paypalLoaded ? (
        <div id="paypal-button-container"></div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Loading PayPal...</span>
        </div>
      )}
    </div>
  );
};

// Subscription Component
const SubscriptionPayment = ({ 
  plans, 
  selectedPlan, 
  onPlanSelect, 
  onSubscriptionSuccess,
  customerInfo 
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          provider: plan.provider,
          customerInfo
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSubscriptionSuccess(data);
      } else {
        throw new Error('Subscription creation failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`
            border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200
            ${selectedPlan?.id === plan.id 
              ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
              : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }
          `}
          onClick={() => onPlanSelect(plan)}
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              ${plan.price}
            </div>
            <div className="text-gray-600 mb-4">per {plan.interval}</div>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <ModernButton
              onClick={() => handleSubscribe(plan)}
              loading={loading}
              className="w-full"
              variant={selectedPlan?.id === plan.id ? 'primary' : 'outline'}
            >
              {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
            </ModernButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export { PaymentComponent, SubscriptionPayment };
