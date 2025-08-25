import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clinicAPI, userAPI } from '../utils/apiService';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaGlobe, 
  FaClock, 
  FaStar, 
  FaCheckCircle, 
  FaDirections,
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaUser,
  FaSpinner,
  FaMap,
  FaCalendarAlt,
  FaEnvelope,
  FaExternalLinkAlt
} from 'react-icons/fa';
import ClinicMap from '../components/ClinicMap';

const ClinicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [clinic, setClinic] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    anonymous: false
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadClinicData();
    } else {
      console.error('Invalid clinic ID:', id);
      navigate('/dashboard');
    }
  }, [id]);

  const loadClinicData = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'undefined') {
        console.error('Invalid clinic ID:', id);
        navigate('/dashboard');
        return;
      }
      
      // Load clinic details
      const clinicData = await clinicAPI.getById(id);
      if (!clinicData) {
        navigate('/dashboard');
        return;
      }
      
      setClinic(clinicData);
      
      // Load reviews
      await loadReviews();
      
      // Check if favorited (if user is logged in)
      if (user) {
        try {
          const favorites = await userAPI.getFavorites();
          setIsFavorite(favorites.some(fav => fav.id === id));
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      }
      
    } catch (error) {
      console.error('Error loading clinic data:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await clinicAPI.getReviews(id);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await userAPI.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await userAPI.addFavorite(id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Unable to update favorites. Please try again.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    try {
      setSubmittingReview(true);
      
      if (editingReview) {
        // Update existing review
        await clinicAPI.updateReview(editingReview.id, {
          rating: parseInt(reviewForm.rating),
          comment: reviewForm.comment.trim(),
          anonymous: reviewForm.anonymous
        });
      } else {
        // Submit new review
        await clinicAPI.submitReview(id, {
          rating: parseInt(reviewForm.rating),
          comment: reviewForm.comment.trim(),
          anonymous: reviewForm.anonymous
        });
      }
      
      // Reset form and reload reviews
      setReviewForm({ rating: 5, comment: '', anonymous: false });
      setShowReviewForm(false);
      setEditingReview(null);
      await loadReviews();
      
      alert(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating,
      comment: review.comment || review.review,
      anonymous: review.anonymous || false
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await clinicAPI.deleteReview(reviewId);
      await loadReviews(); // Refresh reviews
      alert('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: '', anonymous: false });
    setShowReviewForm(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const isCurrentlyOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return null;
    
    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [openHour, openMin] = openTime.split(':').map(Number);
      const [closeHour, closeMin] = closeTime.split(':').map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      return currentTime >= openMinutes && currentTime <= closeMinutes;
    } catch {
      return null;
    }
  };

  const getDirectionsUrl = (clinic) => {
    if (!clinic) return '#';
    
    const address = encodeURIComponent(clinic.address || clinic.name);
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading clinic details...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Clinic Not Found</h2>
          <p className="text-gray-600 mb-6">The clinic you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <FaArrowLeft />
            <span>Back to Search</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clinic Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
                    {clinic.verified && (
                      <FaCheckCircle className="text-green-500 text-xl" title="Verified Clinic" />
                    )}
                  </div>
                  
                  {clinic.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaMapMarkerAlt className="text-sm" />
                      <span>{clinic.location}</span>
                      {clinic.calculatedDistance && (
                        <span className="text-blue-600 font-medium">
                          • {clinic.calculatedDistance.toFixed(1)}km away
                        </span>
                      )}
                    </div>
                  )}
                  
                  {clinic.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`${
                              star <= clinic.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {clinic.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        ({reviews.length} reviews)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Favorite Button */}
                {user && (
                  <button
                    onClick={handleFavoriteToggle}
                    className={`p-3 rounded-full transition-colors ${
                      isFavorite 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                  </button>
                )}
              </div>

              {/* Address and Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600">{clinic.address}</p>
                      {clinic.pincode && (
                        <p className="text-gray-500 text-sm">Pincode: {clinic.pincode}</p>
                      )}
                    </div>
                  </div>

                  {clinic.phone && (
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a 
                          href={`tel:${clinic.phone}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {clinic.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {clinic.email && (
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a 
                          href={`mailto:${clinic.email}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {clinic.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {clinic.website && (
                    <div className="flex items-center gap-3">
                      <FaGlobe className="text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                        <a 
                          href={clinic.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          Visit Website <FaExternalLinkAlt className="text-xs" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operating Hours */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FaClock className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-3">Operating Hours</h3>
                      
                      {clinic.timings ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Daily</span>
                            <span className="font-medium text-gray-900">
                              {clinic.timings}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-green-600">
                              Call for current status
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-500">Hours: Call for information</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-blue-600">
                              Contact clinic for current hours
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Directions */}
                  <div className="pt-4">
                    <a
                      href={getDirectionsUrl(clinic)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaDirections />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Services & Surgeon Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services */}
              {clinic.services && clinic.services.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h2>
                  <div className="space-y-3">
                    {clinic.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <FaCheckCircle className="text-blue-600 flex-shrink-0" />
                        <span className="text-gray-900">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Surgeon/Staff Info */}
              {clinic.surgeon && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Staff</h2>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <FaUser className="text-green-600 text-xl flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Primary Surgeon</h3>
                      <p className="text-green-700 font-medium">{clinic.surgeon}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {clinic.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Clinic</h2>
                <p className="text-gray-600 leading-relaxed">{clinic.description}</p>
              </div>
            )}

            {/* Map */}
            {clinic.lat && clinic.lng && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaMap className="text-blue-600" />
                    Location
                  </h2>
                </div>
                <div className="h-80">
                  <ClinicMap
                    clinics={[clinic]}
                    center={{ lat: clinic.lat, lng: clinic.lng }}
                    zoom={15}
                    onMarkerClick={() => {}}
                  />
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                {user && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {showReviewForm ? 'Cancel' : 'Write Review'}
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl ${
                              star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <FaStar />
                          </button>
                        ))}
                        <span className="ml-2 text-gray-600">
                          {reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Share your experience with this clinic..."
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={reviewForm.anonymous}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, anonymous: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="anonymous" className="text-sm text-gray-600">
                        Submit anonymously
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <>
                            <FaSpinner className="animate-spin inline mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <FaSpinner className="animate-spin text-blue-600 text-2xl mx-auto mb-2" />
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.anonymous ? 'Anonymous' : review.reviewerName || 'User'}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar
                                    key={star}
                                    className={`text-sm ${
                                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.date || review.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 ml-13">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review this clinic!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clinic Image */}
            {clinic.image && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <img 
                  src={clinic.image} 
                  alt={clinic.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                {clinic.location && (
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium text-gray-900">{clinic.location}</p>
                  </div>
                )}

                {clinic.pincode && (
                  <div>
                    <p className="text-sm text-gray-500">Pincode</p>
                    <p className="font-medium text-gray-900">{clinic.pincode}</p>
                  </div>
                )}

                {clinic.verified !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className={clinic.verified ? 'text-green-500' : 'text-gray-400'} />
                      <p className={`font-medium ${clinic.verified ? 'text-green-600' : 'text-gray-500'}`}>
                        {clinic.verified ? 'Verified' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                )}

                {clinic.services && clinic.services.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Services Count</p>
                    <p className="font-medium text-gray-900">{clinic.services.length} services offered</p>
                  </div>
                )}
                
                {clinic.specialization && (
                  <div>
                    <p className="text-sm text-gray-500">Specialization</p>
                    <p className="font-medium text-gray-900">{clinic.specialization}</p>
                  </div>
                )}
                
                {clinic.established && (
                  <div>
                    <p className="text-sm text-gray-500">Established</p>
                    <p className="font-medium text-gray-900">{clinic.established}</p>
                  </div>
                )}

                {clinic.staff_count && (
                  <div>
                    <p className="text-sm text-gray-500">Staff Count</p>
                    <p className="font-medium text-gray-900">{clinic.staff_count} professionals</p>
                  </div>
                )}

                {clinic.emergency_services && (
                  <div>
                    <p className="text-sm text-gray-500">Emergency Services</p>
                    <p className="font-medium text-green-600">Available 24/7</p>
                  </div>
                )}

                {clinic.insurance_accepted && (
                  <div>
                    <p className="text-sm text-gray-500">Insurance</p>
                    <p className="font-medium text-gray-900">Accepted</p>
                  </div>
                )}

                {clinic.parking_available && (
                  <div>
                    <p className="text-sm text-gray-500">Parking</p>
                    <p className="font-medium text-gray-900">Available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
