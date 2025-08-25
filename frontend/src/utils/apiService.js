// Unified API Service - Clean, Robust, No Lag
import { getAuth } from 'firebase/auth';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Enhanced fetch wrapper with proper error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// Clinic API functions
export const clinicAPI = {
  // Get all clinics with optimized caching
  getOptimized: async () => {
    try {
      const data = await apiCall('/clinics/optimized-data');
      return data.clinics || [];
    } catch (error) {
      console.error('Failed to get optimized clinics:', error);
      // Fallback to regular endpoint
      try {
        const fallbackData = await apiCall('/clinics');
        return fallbackData.clinics || [];
      } catch (fallbackError) {
        console.error('Fallback clinic fetch failed:', fallbackError);
        return [];
      }
    }
  },

  // Search by pincode with freemium rules
  searchByPincode: async (pincode, isPremium = false, limit = null) => {
    try {
      const params = new URLSearchParams({
        pincode,
        isPremium: isPremium.toString()
      });
      
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      const data = await apiCall(`/clinics/search-by-pincode?${params}`);
      return {
        clinics: data.clinics || [],
        total: data.total || 0,
        visible: data.visible || 0,
        hidden: data.hidden || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Failed to search by pincode:', error);
      // Fallback to old search
      try {
        const fallbackData = await apiCall(`/clinics/search?q=${pincode}&fields=pincode,address&limit=50`);
        return {
          clinics: fallbackData.clinics || [],
          total: fallbackData.clinics?.length || 0,
          visible: fallbackData.clinics?.length || 0,
          hidden: 0,
          hasMore: false
        };
      } catch (fallbackError) {
        return { clinics: [], total: 0, visible: 0, hidden: 0, hasMore: false };
      }
    }
  },

  // Optimized nearby search with better performance
  getNearbyOptimized: async (lat, lng, radius = 10, isPremium = false, limit = null) => {
    try {
      const data = await apiCall('/clinics/nearby-optimized', {
        method: 'POST',
        body: JSON.stringify({ 
          lat, 
          lng, 
          radius: isPremium ? Math.min(radius, 20) : Math.min(radius, 5),
          isPremium,
          limit 
        })
      });
      return {
        clinics: data.clinics || [],
        total: data.total || 0,
        visible: data.visible || 0,
        hidden: data.hidden || 0,
        hasMore: data.hasMore || false,
        searchRadius: data.searchRadius || radius,
        userLocation: data.userLocation || { lat, lng }
      };
    } catch (error) {
      console.error('Failed to get optimized nearby clinics:', error);
      // Fallback to regular nearby endpoint
      return clinicAPI.getNearby(lat, lng, radius, isPremium);
    }
  },

  // Get nearby clinics with optimized search (legacy support)
  getNearby: async (lat, lng, radius = 10, isPremium = false) => {
    try {
      const data = await apiCall('/clinics/nearby', {
        method: 'POST',
        body: JSON.stringify({ 
          lat, 
          lng, 
          radius: isPremium ? Math.min(radius, 20) : Math.min(radius, 5),
          isPremium 
        })
      });
      return data.clinics || data.visible || [];
    } catch (error) {
      console.error('Failed to get nearby clinics:', error);
      return [];
    }
  },

  // Search by pincode (legacy support)
  getByPincode: async (pincode) => {
    try {
      const result = await clinicAPI.searchByPincode(pincode, false);
      return result.clinics;
    } catch (error) {
      console.error('Failed to search by pincode:', error);
      return [];
    }
  },

  // Get clinic details
  getById: async (id) => {
    try {
      const data = await apiCall(`/clinics/${id}`);
      return data.clinic || data;
    } catch (error) {
      console.error('Failed to get clinic details:', error);
      return null;
    }
  },

  // Get clinic reviews
  getReviews: async (clinicId) => {
    try {
      const data = await apiCall(`/clinics/${clinicId}/reviews`);
      return data.reviews || [];
    } catch (error) {
      console.error('Failed to get reviews:', error);
      return [];
    }
  },

  // Submit review - FIXED
  submitReview: async (clinicId, reviewData) => {
    try {
      const data = await apiCall(`/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicId,
          rating: parseInt(reviewData.rating),
          comment: reviewData.comment?.trim() || '',
          anonymous: reviewData.anonymous || false
        })
      });
      return data;
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  }
};

// User API functions
export const userAPI = {
  // Get user favorites
  getFavorites: async () => {
    try {
      const data = await apiCall('/user/favorites');
      return data.favorites || [];
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  },

  // Add to favorites
  addFavorite: async (clinicId) => {
    try {
      const data = await apiCall(`/user/favorites/${clinicId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'add' })
      });
      return data;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // Remove from favorites
  removeFavorite: async (clinicId) => {
    try {
      const data = await apiCall(`/user/favorites/${clinicId}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const data = await apiCall('/user/profile');
      return data.user || data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const data = await apiCall('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Get user reviews
  getMyReviews: async () => {
    try {
      const data = await apiCall('/user/reviews');
      return data.reviews || [];
    } catch (error) {
      console.error('Failed to get user reviews:', error);
      return [];
    }
  },

  // Get user dashboard data (batch request)
  getDashboard: async () => {
    try {
      const data = await apiCall('/user/dashboard');
      return data;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }
};

// Auth API functions
export const authAPI = {
  // Verify Firebase token with backend
  verifyToken: async (token) => {
    try {
      const data = await apiCall('/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return data;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  },

  // Register user with backend
  register: async (userData) => {
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }
};

// Admin API functions
export const adminAPI = {
  // Get admin dashboard data
  getDashboard: async () => {
    try {
      const data = await apiCall('/admin/dashboard');
      return data;
    } catch (error) {
      console.error('Failed to get admin dashboard:', error);
      throw error;
    }
  },

  // Get all clinics for admin
  getClinics: async () => {
    try {
      const data = await apiCall('/admin/clinics');
      return data.clinics || [];
    } catch (error) {
      console.error('Failed to get admin clinics:', error);
      return [];
    }
  },

  // Add new clinic
  addClinic: async (clinicData) => {
    try {
      const data = await apiCall('/admin/clinics', {
        method: 'POST',
        body: JSON.stringify(clinicData)
      });
      return data;
    } catch (error) {
      console.error('Failed to add clinic:', error);
      throw error;
    }
  },

  // Update clinic
  updateClinic: async (id, clinicData) => {
    try {
      const data = await apiCall(`/admin/clinics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clinicData)
      });
      return data;
    } catch (error) {
      console.error('Failed to update clinic:', error);
      throw error;
    }
  },

  // Delete clinic
  deleteClinic: async (id) => {
    try {
      const data = await apiCall(`/admin/clinics/${id}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('Failed to delete clinic:', error);
      throw error;
    }
  },

  // Get all reviews for admin
  getReviews: async () => {
    try {
      const data = await apiCall('/admin/reviews');
      return data.reviews || [];
    } catch (error) {
      console.error('Failed to get admin reviews:', error);
      return [];
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    try {
      const data = await apiCall(`/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  }
};

// Utility functions
export const utilAPI = {
  // Health check
  healthCheck: async () => {
    try {
      const data = await apiCall('/health');
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  },

  // Get coordinates from pincode
  getCoordinates: async (pincode) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=India&postalcode=${pincode}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get coordinates:', error);
      return null;
    }
  }
};

// Premium API functions
export const premiumAPI = {
  // Create premium order
  createOrder: async (userId, userEmail, planType = 'premium') => {
    try {
      const data = await apiCall('/premium/create-order', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          userEmail,
          planType
        })
      });
      return data;
    } catch (error) {
      console.error('Failed to create premium order:', error);
      throw error;
    }
  },

  // Verify premium payment
  verifyPayment: async (paymentData) => {
    try {
      const data = await apiCall('/premium/verify-payment', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return data;
    } catch (error) {
      console.error('Failed to verify premium payment:', error);
      throw error;
    }
  }
};

// Default export
const apiService = {
  clinic: clinicAPI,
  user: userAPI,
  auth: authAPI,
  admin: adminAPI,
  util: utilAPI,
  premium: premiumAPI,
  getBaseUrl: () => API_BASE
};

export default apiService;
