// Razorpay Payment Service
export class RazorpayService {
  constructor() {
    this.isLoaded = false;
    this.loadScript();
  }

  // Load Razorpay script dynamically
  loadScript() {
    if (window.Razorpay) {
      this.isLoaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    });
  }

  // Create order on backend
  async createOrder(amount, currency = 'INR', receipt) {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          payment_capture: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      return order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  // Verify payment on backend
  async verifyPayment(paymentData) {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Initialize payment
  async initiatePayment({
    amount,
    currency = 'INR',
    receipt,
    description,
    customerInfo,
    onSuccess,
    onFailure,
    onDismiss
  }) {
    try {
      // Ensure Razorpay is loaded
      if (!this.isLoaded) {
        await this.loadScript();
      }

      // Create order
      const order = await this.createOrder(amount, currency, receipt);

      // Payment options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Your Razorpay key
        amount: order.amount,
        currency: order.currency,
        name: 'RehabConnect',
        description: description || 'Premium Subscription',
        image: '/robobionicslogo.png',
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verificationResult = await this.verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            if (verificationResult.success) {
              onSuccess && onSuccess(verificationResult);
            } else {
              onFailure && onFailure(new Error('Payment verification failed'));
            }
          } catch (error) {
            onFailure && onFailure(error);
          }
        },
        prefill: {
          name: customerInfo?.name || '',
          email: customerInfo?.email || '',
          contact: customerInfo?.phone || ''
        },
        notes: {
          address: customerInfo?.address || '',
          plan_type: receipt || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            onDismiss && onDismiss();
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return razorpay;
    } catch (error) {
      console.error('Payment initiation error:', error);
      onFailure && onFailure(error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`/api/payment/status/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Payment status error:', error);
      throw error;
    }
  }

  // Handle subscription upgrade
  async upgradeSubscription(planDetails, customerInfo) {
    return new Promise((resolve, reject) => {
      this.initiatePayment({
        amount: planDetails.price,
        receipt: `premium_${planDetails.id}_${Date.now()}`,
        description: `${planDetails.name} - ${planDetails.duration}`,
        customerInfo,
        onSuccess: (result) => {
          // Update user subscription status
          this.updateUserSubscription(result, planDetails)
            .then(() => resolve(result))
            .catch(reject);
        },
        onFailure: reject,
        onDismiss: () => {
          reject(new Error('Payment cancelled by user'));
        }
      });
    });
  }

  // Update user subscription in backend
  async updateUserSubscription(paymentResult, planDetails) {
    try {
      const response = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          payment_id: paymentResult.payment_id,
          order_id: paymentResult.order_id,
          plan_id: planDetails.id,
          plan_name: planDetails.name,
          amount: planDetails.price,
          duration: planDetails.duration,
          features: planDetails.features
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const result = await response.json();
      
      // Update local storage
      localStorage.setItem('userSubscription', JSON.stringify(result.subscription));
      
      return result;
    } catch (error) {
      console.error('Subscription update error:', error);
      throw error;
    }
  }

  // Check if user has active premium subscription
  static hasActivePremium() {
    try {
      const subscription = JSON.parse(localStorage.getItem('userSubscription') || '{}');
      const currentDate = new Date();
      const expiryDate = new Date(subscription.expiresAt);
      
      return subscription.status === 'active' && currentDate <= expiryDate;
    } catch (error) {
      return false;
    }
  }

  // Get user subscription details
  static getSubscriptionDetails() {
    try {
      return JSON.parse(localStorage.getItem('userSubscription') || '{}');
    } catch (error) {
      return {};
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

export default razorpayService;
