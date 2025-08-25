// Professional Database Service for User & Subscription Management
const mysql = require('mysql2/promise');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.init();
  }

  async init() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rehabconnect',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timezone: '+00:00'
      });
      
      console.log('✅ Database connection pool initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  // User Management
  async createOrUpdateUser(firebaseUid, userData) {
    const connection = await this.pool.getConnection();
    
    try {
      const { email, name, phone, profileImage } = userData;
      
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE firebase_uid = ?',
        [firebaseUid]
      );

      if (existing.length > 0) {
        // Update existing user
        await connection.execute(
          `UPDATE users SET 
           name = COALESCE(?, name),
           phone = COALESCE(?, phone), 
           profile_image_url = COALESCE(?, profile_image_url),
           last_login = NOW(),
           updated_at = NOW()
           WHERE firebase_uid = ?`,
          [name, phone, profileImage, firebaseUid]
        );
        
        return existing[0].id;
      } else {
        // Create new user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await connection.execute(
          `INSERT INTO users (id, firebase_uid, email, name, phone, profile_image_url, last_login) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [userId, firebaseUid, email, name, phone, profileImage]
        );
        
        return userId;
      }
    } finally {
      connection.release();
    }
  }

  async getUserByFirebaseUid(firebaseUid) {
    const [rows] = await this.pool.execute(
      `SELECT u.*, s.status as subscription_status, s.expires_at as premium_expires_at
       FROM users u 
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.firebase_uid = ?`,
      [firebaseUid]
    );

    if (rows.length === 0) return null;

    const user = rows[0];
    
    // Check if premium is still valid
    user.is_premium = user.is_premium && 
      user.premium_expires_at && 
      new Date(user.premium_expires_at) > new Date();

    return user;
  }

  // Subscription Management
  async createSubscription(userId, planData, paymentData) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate expiry date
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      
      if (planData.type === 'yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      }

      // Create subscription
      await connection.execute(
        `INSERT INTO subscriptions 
         (id, user_id, plan_type, amount, currency, payment_gateway, gateway_subscription_id, starts_at, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          subscriptionId, userId, planData.type, planData.amount, 
          planData.currency, paymentData.gateway, paymentData.gatewaySubscriptionId,
          startDate, expiryDate
        ]
      );

      await connection.commit();
      return subscriptionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async activateSubscription(subscriptionId, transactionData) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update subscription status
      await connection.execute(
        'UPDATE subscriptions SET status = "active", updated_at = NOW() WHERE id = ?',
        [subscriptionId]
      );

      // Update user premium status
      const [subscription] = await connection.execute(
        'SELECT user_id, expires_at FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );

      if (subscription.length > 0) {
        await connection.execute(
          `UPDATE users SET 
           is_premium = TRUE, 
           premium_expires_at = ?, 
           subscription_type = (SELECT plan_type FROM subscriptions WHERE id = ?),
           subscription_id = ?,
           updated_at = NOW() 
           WHERE id = ?`,
          [subscription[0].expires_at, subscriptionId, subscriptionId, subscription[0].user_id]
        );
      }

      // Create transaction record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await connection.execute(
        `INSERT INTO transactions 
         (id, user_id, subscription_id, amount, currency, payment_gateway, gateway_transaction_id, 
          gateway_payment_id, gateway_order_id, status, payment_method, gateway_response)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
        [
          transactionId, subscription[0].user_id, subscriptionId,
          transactionData.amount, transactionData.currency, transactionData.gateway,
          transactionData.gatewayTransactionId, transactionData.gatewayPaymentId,
          transactionData.gatewayOrderId, transactionData.paymentMethod,
          JSON.stringify(transactionData.gatewayResponse)
        ]
      );

      await connection.commit();
      return { subscriptionId, transactionId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Clinic Management
  async getClinicById(clinicId) {
    const [clinics] = await this.pool.execute(
      `SELECT c.*, 
       (SELECT JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', ci.id,
           'url', ci.image_url,
           'type', ci.image_type,
           'title', ci.title,
           'isPrimary', ci.is_primary,
           'displayOrder', ci.display_order
         )
       ) FROM clinic_images ci WHERE ci.clinic_id = c.id AND ci.status = 'active' ORDER BY ci.display_order) as images
       FROM clinics c WHERE c.id = ? AND c.status = 'active'`,
      [clinicId]
    );

    return clinics.length > 0 ? clinics[0] : null;
  }

  async getClinicReviews(clinicId, limit = 10, offset = 0) {
    const [reviews] = await this.pool.execute(
      `SELECT r.*, u.name as user_name, u.profile_image_url as user_image
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.clinic_id = ? AND r.status = 'active'
       ORDER BY r.created_at DESC 
       LIMIT ? OFFSET ?`,
      [clinicId, limit, offset]
    );

    return reviews;
  }

  // User Interactions
  async addToFavorites(userId, clinicId) {
    try {
      const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.pool.execute(
        'INSERT INTO user_favorites (id, user_id, clinic_id) VALUES (?, ?, ?)',
        [favoriteId, userId, clinicId]
      );
      return favoriteId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Clinic already in favorites');
      }
      throw error;
    }
  }

  async removeFromFavorites(userId, clinicId) {
    const [result] = await this.pool.execute(
      'DELETE FROM user_favorites WHERE user_id = ? AND clinic_id = ?',
      [userId, clinicId]
    );
    return result.affectedRows > 0;
  }

  async getUserFavorites(userId) {
    const [favorites] = await this.pool.execute(
      `SELECT c.*, uf.created_at as favorited_at
       FROM user_favorites uf
       JOIN clinics c ON uf.clinic_id = c.id
       WHERE uf.user_id = ? AND c.status = 'active'
       ORDER BY uf.created_at DESC`,
      [userId]
    );
    return favorites;
  }

  async addClinicView(userId, clinicId, sessionData) {
    const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.pool.execute(
      `INSERT INTO user_clinic_views (id, user_id, clinic_id, session_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [viewId, userId, clinicId, sessionData.sessionId, sessionData.ipAddress, sessionData.userAgent]
    );
    return viewId;
  }

  async getUserHistory(userId, limit = 20) {
    const [history] = await this.pool.execute(
      `SELECT c.*, ucv.viewed_at
       FROM user_clinic_views ucv
       JOIN clinics c ON ucv.clinic_id = c.id
       WHERE ucv.user_id = ? AND c.status = 'active'
       GROUP BY c.id
       ORDER BY ucv.viewed_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return history;
  }

  // Review Management
  async createReview(userId, clinicId, reviewData) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.execute(
        `INSERT INTO reviews (id, user_id, clinic_id, rating, title, comment, images, visit_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reviewId, userId, clinicId, reviewData.rating, reviewData.title,
          reviewData.comment, JSON.stringify(reviewData.images || []), reviewData.visitDate
        ]
      );

      // Update clinic rating
      await this.updateClinicRating(clinicId, connection);

      await connection.commit();
      return reviewId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateClinicRating(clinicId, connection = null) {
    const conn = connection || await this.pool.getConnection();
    
    try {
      const [ratings] = await conn.execute(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE clinic_id = ? AND status = "active"',
        [clinicId]
      );

      if (ratings.length > 0) {
        const { avg_rating, total_reviews } = ratings[0];
        await conn.execute(
          'UPDATE clinics SET rating = ?, total_reviews = ? WHERE id = ?',
          [parseFloat(avg_rating || 0).toFixed(2), total_reviews, clinicId]
        );
      }
    } finally {
      if (!connection) conn.release();
    }
  }

  // Admin Operations
  async getAdminStats() {
    const [stats] = await this.pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_premium = TRUE) as premium_users,
        (SELECT COUNT(*) FROM clinics WHERE status = 'active') as active_clinics,
        (SELECT COUNT(*) FROM reviews WHERE status = 'active') as total_reviews,
        (SELECT SUM(amount) FROM transactions WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_revenue,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions
    `);

    return stats[0];
  }

  async searchUsers(query, limit = 20, offset = 0) {
    const [users] = await this.pool.execute(
      `SELECT id, name, email, is_premium, created_at, last_login 
       FROM users 
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, limit, offset]
    );
    return users;
  }

  // System Health
  async healthCheck() {
    try {
      const [result] = await this.pool.execute('SELECT 1 as status');
      return result[0].status === 1;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new DatabaseService();
