require('dotenv').config();

class PaymentService {
  constructor() {
    this.stripe = null;
    this.razorpay = null;
    this.paypal = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize Stripe
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe');
        this.stripe = stripe(process.env.STRIPE_SECRET_KEY);
        console.log('✅ Stripe initialized');
      }
    } catch (error) {
      console.log('⚠️ Stripe not available:', error.message);
    }

    // Initialize Razorpay
    try {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log('✅ Razorpay initialized');
      }
    } catch (error) {
      console.log('⚠️ Razorpay not available:', error.message);
    }

    // Initialize PayPal
    try {
      if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        const paypal = require('@paypal/checkout-server-sdk');
        const environment = process.env.NODE_ENV === 'production' 
          ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
          : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
        
        this.paypal = new paypal.core.PayPalHttpClient(environment);
        console.log('✅ PayPal initialized');
      }
    } catch (error) {
      console.log('⚠️ PayPal not available:', error.message);
    }
  }

  // Stripe Payment Methods
  async createStripePaymentIntent(amount, currency = 'usd', metadata = {}) {
    if (!this.stripe) throw new Error('Stripe not configured');
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: { enabled: true },
        metadata
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async confirmStripePayment(paymentIntentId) {
    if (!this.stripe) throw new Error('Stripe not configured');

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      throw new Error(`Stripe confirmation failed: ${error.message}`);
    }
  }

  // Razorpay Payment Methods
  async createRazorpayOrder(amount, currency = 'INR', receipt, notes = {}) {
    if (!this.razorpay) throw new Error('Razorpay not configured');

    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes
      };

      const order = await this.razorpay.orders.create(options);
      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      };
    } catch (error) {
      throw new Error(`Razorpay order creation failed: ${error.message}`);
    }
  }

  async verifyRazorpayPayment(paymentId, orderId, signature) {
    if (!this.razorpay) throw new Error('Razorpay not configured');

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (isValid) {
        const payment = await this.razorpay.payments.fetch(paymentId);
        return {
          success: true,
          verified: true,
          status: payment.status,
          amount: payment.amount / 100,
          currency: payment.currency
        };
      } else {
        return { success: false, verified: false, error: 'Invalid signature' };
      }
    } catch (error) {
      throw new Error(`Razorpay verification failed: ${error.message}`);
    }
  }

  // PayPal Payment Methods
  async createPayPalOrder(amount, currency = 'USD', description = 'Healthcare Service Payment') {
    if (!this.paypal) throw new Error('PayPal not configured');

    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          description
        }]
      });

      const response = await this.paypal.execute(request);
      return {
        success: true,
        orderId: response.result.id,
        status: response.result.status,
        links: response.result.links
      };
    } catch (error) {
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  async capturePayPalOrder(orderId) {
    if (!this.paypal) throw new Error('PayPal not configured');

    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.paypal.execute(request);
      return {
        success: true,
        status: response.result.status,
        amount: response.result.purchase_units[0].payments.captures[0].amount.value,
        currency: response.result.purchase_units[0].payments.captures[0].amount.currency_code
      };
    } catch (error) {
      throw new Error(`PayPal capture failed: ${error.message}`);
    }
  }

  // Professional Healthcare Platform Payment Processing
  async processPayment(provider, paymentData) {
    try {
      // Validate payment data
      this.validatePaymentData(paymentData);
      
      // Log payment attempt
      console.log(`🔄 Processing ${provider} payment for user ${paymentData.userId}`);
      
      let result;
      switch (provider.toLowerCase()) {
        case 'stripe':
          result = await this.processStripePayment(paymentData);
          break;
        case 'razorpay':
          result = await this.processRazorpayPayment(paymentData);
          break;
        case 'paypal':
          result = await this.processPayPalPayment(paymentData);
          break;
        default:
          throw new Error('Unsupported payment provider');
      }

      // Record transaction in database
      if (result.success) {
        await this.recordTransaction(provider, paymentData, result);
      }

      return result;
    } catch (error) {
      console.error(`❌ Payment processing failed:`, error);
      throw error;
    }
  }

  async processStripePayment(data) {
    const { amount, currency, metadata, userId, planType } = data;
    
    // Enhanced metadata for healthcare platform
    const enhancedMetadata = {
      ...metadata,
      userId,
      planType,
      platform: 'RehabConnect',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    return await this.createStripePaymentIntent(amount, currency, enhancedMetadata);
  }

  async processRazorpayPayment(data) {
    const { amount, currency, userId, planType, userEmail } = data;
    
    // Generate professional receipt ID
    const receipt = this.generateReceiptId(userId, planType);
    
    // Enhanced notes for tracking
    const notes = {
      userId,
      planType,
      userEmail,
      platform: 'RehabConnect',
      environment: process.env.NODE_ENV || 'development'
    };

    return await this.createRazorpayOrder(amount, currency, receipt, notes);
  }

  async processPayPalPayment(data) {
    const { amount, currency, planType } = data;
    const description = `RehabConnect ${planType} Premium Plan - Healthcare Platform Access`;
    return await this.createPayPalOrder(amount, currency, description);
  }

  // Professional validation and utilities
  validatePaymentData(data) {
    const required = ['amount', 'userId', 'planType'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required payment data: ${missing.join(', ')}`);
    }

    if (!this.validatePlanAmount(data.planType, data.amount)) {
      throw new Error('Invalid amount for selected plan');
    }

    if (data.amount < 1 || data.amount > 50000) {
      throw new Error('Payment amount out of valid range');
    }
  }

  validatePlanAmount(planType, amount) {
    const validPlans = {
      monthly: 199,
      yearly: 1999,
      lifetime: 4999
    };

    return validPlans[planType] === amount;
  }

  generateReceiptId(userId, planType) {
    const timestamp = Date.now();
    const userSuffix = userId.slice(-6);
    return `RC_${planType.toUpperCase()}_${userSuffix}_${timestamp}`;
  }

  async recordTransaction(provider, paymentData, result) {
    try {
      const DatabaseService = require('./databaseService');
      
      const transactionData = {
        userId: paymentData.userId,
        planType: paymentData.planType,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        provider: provider,
        providerId: result.orderId || result.paymentIntentId || result.orderId,
        status: 'initiated',
        metadata: {
          clientSecret: result.clientSecret,
          receiptId: paymentData.receiptId || this.generateReceiptId(paymentData.userId, paymentData.planType),
          userAgent: paymentData.userAgent,
          ipAddress: paymentData.ipAddress
        }
      };

      await DatabaseService.createTransaction(transactionData);
      console.log(`✅ Transaction recorded: ${transactionData.metadata.receiptId}`);
    } catch (error) {
      console.error('❌ Failed to record transaction:', error);
      // Don't throw here - payment can still proceed
    }
  }

  // Subscription Management
  async createSubscription(provider, planId, customerId) {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return await this.createStripeSubscription(planId, customerId);
      case 'razorpay':
        return await this.createRazorpaySubscription(planId, customerId);
      default:
        throw new Error('Subscription not supported for this provider');
    }
  }

  async createStripeSubscription(priceId, customerId) {
    if (!this.stripe) throw new Error('Stripe not configured');

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      throw new Error(`Stripe subscription failed: ${error.message}`);
    }
  }

  async createRazorpaySubscription(planId, customerId) {
    if (!this.razorpay) throw new Error('Razorpay not configured');

    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        total_count: 12, // 12 months
        quantity: 1
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        shortUrl: subscription.short_url
      };
    } catch (error) {
      throw new Error(`Razorpay subscription failed: ${error.message}`);
    }
  }

  // Refund Methods
  async processRefund(provider, paymentId, amount = null, reason = 'requested_by_customer') {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return await this.createStripeRefund(paymentId, amount, reason);
      case 'razorpay':
        return await this.createRazorpayRefund(paymentId, amount, reason);
      default:
        throw new Error('Refund not supported for this provider');
    }
  }

  async createStripeRefund(paymentIntentId, amount = null, reason) {
    if (!this.stripe) throw new Error('Stripe not configured');

    try {
      const refundData = { payment_intent: paymentIntentId, reason };
      if (amount) refundData.amount = Math.round(amount * 100);

      const refund = await this.stripe.refunds.create(refundData);
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  async createRazorpayRefund(paymentId, amount = null, reason) {
    if (!this.razorpay) throw new Error('Razorpay not configured');

    try {
      const refundData = {};
      if (amount) refundData.amount = Math.round(amount * 100);
      if (reason) refundData.notes = { reason };

      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      throw new Error(`Razorpay refund failed: ${error.message}`);
    }
  }

  // Professional Webhook Handlers with Database Integration
  async handleWebhook(provider, payload, signature, headers = {}) {
    try {
      console.log(`🔔 Processing ${provider} webhook`);
      
      let event;
      switch (provider.toLowerCase()) {
        case 'stripe':
          event = await this.handleStripeWebhook(payload, signature);
          break;
        case 'razorpay':
          event = await this.handleRazorpayWebhook(payload, signature);
          break;
        case 'paypal':
          event = await this.handlePayPalWebhook(payload, signature);
          break;
        default:
          throw new Error('Webhook not supported for this provider');
      }

      // Process the webhook event
      if (event.success) {
        await this.processWebhookEvent(provider, event.event);
      }

      return event;
    } catch (error) {
      console.error(`❌ Webhook processing failed:`, error);
      throw error;
    }
  }

  async processWebhookEvent(provider, event) {
    try {
      const DatabaseService = require('./databaseService');
      
      if (provider === 'stripe') {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSuccess(event.data.object, 'stripe');
            break;
          case 'payment_intent.payment_failed':
            await this.handlePaymentFailure(event.data.object, 'stripe');
            break;
          case 'customer.subscription.created':
          case 'invoice.payment_succeeded':
            await this.handleSubscriptionSuccess(event.data.object, 'stripe');
            break;
          case 'customer.subscription.deleted':
          case 'invoice.payment_failed':
            await this.handleSubscriptionFailure(event.data.object, 'stripe');
            break;
        }
      } else if (provider === 'razorpay') {
        switch (event.event) {
          case 'payment.captured':
            await this.handlePaymentSuccess(event.payload.payment.entity, 'razorpay');
            break;
          case 'payment.failed':
            await this.handlePaymentFailure(event.payload.payment.entity, 'razorpay');
            break;
          case 'subscription.charged':
            await this.handleSubscriptionSuccess(event.payload.subscription.entity, 'razorpay');
            break;
          case 'subscription.cancelled':
            await this.handleSubscriptionFailure(event.payload.subscription.entity, 'razorpay');
            break;
        }
      }
    } catch (error) {
      console.error('❌ Webhook event processing failed:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentData, provider) {
    try {
      const DatabaseService = require('./databaseService');
      
      // Extract user information from payment metadata
      const userId = provider === 'stripe' 
        ? paymentData.metadata?.userId 
        : paymentData.notes?.userId;
      
      const planType = provider === 'stripe'
        ? paymentData.metadata?.planType
        : paymentData.notes?.planType;

      if (!userId || !planType) {
        console.error('❌ Missing userId or planType in payment metadata');
        return;
      }

      // Update transaction status
      const providerId = provider === 'stripe' ? paymentData.id : paymentData.id;
      await DatabaseService.updateTransactionStatus(providerId, 'completed', {
        paymentMethod: paymentData.payment_method || paymentData.method,
        completedAt: new Date(),
        gatewayResponse: paymentData
      });

      // Activate premium subscription
      const subscriptionData = {
        planType,
        startDate: new Date(),
        provider,
        providerId,
        amount: provider === 'stripe' ? paymentData.amount / 100 : paymentData.amount / 100,
        currency: paymentData.currency
      };

      await DatabaseService.activateSubscription(userId, subscriptionData);
      
      console.log(`✅ Premium activated for user ${userId}: ${planType} plan via ${provider}`);
      
      // TODO: Send confirmation email
      // await this.sendPaymentConfirmationEmail(userId, subscriptionData);
      
    } catch (error) {
      console.error('❌ Payment success handling failed:', error);
    }
  }

  async handlePaymentFailure(paymentData, provider) {
    try {
      const DatabaseService = require('./databaseService');
      
      const providerId = provider === 'stripe' ? paymentData.id : paymentData.id;
      
      // Update transaction status
      await DatabaseService.updateTransactionStatus(providerId, 'failed', {
        failureReason: paymentData.last_payment_error?.message || paymentData.error_description,
        failedAt: new Date(),
        gatewayResponse: paymentData
      });

      console.log(`❌ Payment failed: ${providerId}`);
      
      // TODO: Send failure notification email
      
    } catch (error) {
      console.error('❌ Payment failure handling failed:', error);
    }
  }

  async handleSubscriptionSuccess(subscriptionData, provider) {
    try {
      const DatabaseService = require('./databaseService');
      
      // Handle recurring subscription charges
      console.log(`✅ Subscription charged: ${subscriptionData.id} via ${provider}`);
      
      // Extend subscription period
      // This would be handled based on your business logic
      
    } catch (error) {
      console.error('❌ Subscription success handling failed:', error);
    }
  }

  async handleSubscriptionFailure(subscriptionData, provider) {
    try {
      const DatabaseService = require('./databaseService');
      
      console.log(`❌ Subscription cancelled: ${subscriptionData.id} via ${provider}`);
      
      // Handle subscription cancellation
      // Update user premium status if needed
      
    } catch (error) {
      console.error('❌ Subscription failure handling failed:', error);
    }
  }

  async handleStripeWebhook(payload, sig) {
    if (!this.stripe) throw new Error('Stripe not configured');

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return { success: true, event };
    } catch (error) {
      throw new Error(`Stripe webhook failed: ${error.message}`);
    }
  }

  async handleRazorpayWebhook(payload, signature) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      return { success: true, event: payload };
    } catch (error) {
      throw new Error(`Razorpay webhook failed: ${error.message}`);
    }
  }

  // Professional Plan Management
  getPlanDetails() {
    return {
      monthly: {
        name: 'Premium Monthly',
        price: 199,
        currency: 'INR',
        duration: 30,
        features: [
          'Unlimited clinic search',
          'Advanced filters',
          'Detailed clinic information',
          'Direct contact access',
          'Priority support',
          'No advertisements'
        ],
        savings: null
      },
      yearly: {
        name: 'Premium Yearly',
        price: 1999,
        currency: 'INR',
        duration: 365,
        features: [
          'All monthly features',
          'Extended search radius',
          'Priority listing for clinics',
          'Advanced analytics',
          'Bulk export features',
          'Dedicated account manager'
        ],
        savings: '₹389 (16% off)'
      },
      lifetime: {
        name: 'Premium Lifetime',
        price: 4999,
        currency: 'INR',
        duration: null,
        features: [
          'All yearly features',
          'Lifetime access',
          'Beta feature access',
          'Premium partner benefits',
          'Custom integrations',
          'White-label options'
        ],
        savings: '₹12,000+ (70% off)'
      }
    };
  }

  calculatePlanValue(planType) {
    const plans = this.getPlanDetails();
    const plan = plans[planType];
    
    if (!plan) {
      throw new Error('Invalid plan type');
    }

    return {
      ...plan,
      dailyPrice: plan.duration ? (plan.price / plan.duration).toFixed(2) : 'N/A',
      monthlyEquivalent: plan.duration ? ((plan.price / plan.duration) * 30).toFixed(0) : 'N/A'
    };
  }

  // Professional pricing utilities
  formatIndianCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  calculateDiscount(originalPrice, discountedPrice) {
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
  }

  getPricingComparison() {
    const plans = this.getPlanDetails();
    const monthly = plans.monthly;
    const yearly = plans.yearly;
    
    return {
      monthly: {
        ...monthly,
        formattedPrice: this.formatIndianCurrency(monthly.price),
        perDay: this.formatIndianCurrency(monthly.price / 30)
      },
      yearly: {
        ...yearly,
        formattedPrice: this.formatIndianCurrency(yearly.price),
        perDay: this.formatIndianCurrency(yearly.price / 365),
        monthlyEquivalent: this.formatIndianCurrency(yearly.price / 12),
        discount: this.calculateDiscount(monthly.price * 12, yearly.price)
      }
    };
  }

  // Professional subscription management
  async getSubscriptionStatus(userId) {
    try {
      const DatabaseService = require('./databaseService');
      return await DatabaseService.getUserSubscription(userId);
    } catch (error) {
      console.error('❌ Failed to get subscription status:', error);
      throw error;
    }
  }

  async cancelSubscription(userId, reason = 'user_requested') {
    try {
      const DatabaseService = require('./databaseService');
      
      // Get current subscription
      const subscription = await DatabaseService.getUserSubscription(userId);
      
      if (!subscription || !subscription.isActive) {
        throw new Error('No active subscription found');
      }

      // Cancel with payment provider
      if (subscription.provider === 'stripe' && this.stripe) {
        await this.stripe.subscriptions.update(subscription.providerId, {
          cancel_at_period_end: true
        });
      } else if (subscription.provider === 'razorpay' && this.razorpay) {
        await this.razorpay.subscriptions.cancel(subscription.providerId);
      }

      // Update database
      await DatabaseService.updateSubscription(subscription.id, {
        cancelledAt: new Date(),
        cancellationReason: reason,
        status: 'cancelled'
      });

      console.log(`✅ Subscription cancelled for user ${userId}`);
      
      return {
        success: true,
        message: 'Subscription cancelled successfully',
        validUntil: subscription.expiresAt
      };
      
    } catch (error) {
      console.error('❌ Subscription cancellation failed:', error);
      throw error;
    }
  }

  // Payment analytics and reporting
  async getPaymentAnalytics(startDate, endDate) {
    try {
      const DatabaseService = require('./databaseService');
      
      const analytics = await DatabaseService.getPaymentAnalytics(startDate, endDate);
      
      return {
        totalRevenue: analytics.totalRevenue,
        totalTransactions: analytics.totalTransactions,
        successRate: (analytics.successfulTransactions / analytics.totalTransactions * 100).toFixed(2),
        averageOrderValue: (analytics.totalRevenue / analytics.successfulTransactions).toFixed(2),
        planBreakdown: analytics.planBreakdown,
        providerBreakdown: analytics.providerBreakdown,
        formattedRevenue: this.formatIndianCurrency(analytics.totalRevenue)
      };
      
    } catch (error) {
      console.error('❌ Payment analytics failed:', error);
      throw error;
    }
  }

  // Health check with enhanced status
  async healthCheck() {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      providers: {
        stripe: !!this.stripe,
        razorpay: !!this.razorpay,
        paypal: !!this.paypal
      },
      available: this.getAvailableProviders(),
      configuration: {
        webhooksConfigured: !!(process.env.STRIPE_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET),
        databaseConnected: true // This would be checked via DatabaseService
      }
    };
    
    // Test connectivity
    try {
      if (this.stripe) {
        await this.stripe.balance.retrieve();
        status.providers.stripeConnected = true;
      }
    } catch (error) {
      status.providers.stripeConnected = false;
      status.providers.stripeError = error.message;
    }
    
    return status;
  }
}

module.exports = new PaymentService();
