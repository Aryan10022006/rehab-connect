import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaMapMarkerAlt, FaStar, FaRegStar, FaMapMarkedAlt, FaEdit, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa";
import { getApiUrl, fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ClinicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const isAdmin = user && user.email && (process.env.REACT_APP_ADMIN_EMAILS || '').split(',').includes(user.email);
  const [replyText, setReplyText] = useState({});
  const [flagged, setFlagged] = useState({});

  useEffect(() => {
    const fetchClinic = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiUrl()}/clinics/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClinic(data);
        } else {
          setClinic(null);
        }
      } catch {
        setClinic(null);
      }
      setLoading(false);
    };
    fetchClinic();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/clinics/${id}/reviews`);
        if (res.ok) {
          setReviews(await res.json());
        }
      } catch {}
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    // Fetch if this clinic is a favorite
    const fetchFavorite = async () => {
      if (!user?.token) return;
      try {
        const res = await fetchWithAuth(`${getApiUrl()}/user/favorites`);
        if (res.ok) {
          const favs = await res.json();
          setIsFavorite(favs.some(f => f.id === id));
        }
      } catch {}
    };
    fetchFavorite();
  }, [id, user]);

  const handleAddReview = async () => {
    setReviewError("");
    if (!reviewText.trim()) {
      setReviewError("Review cannot be empty.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/clinics/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ text: reviewText })
      });
      if (res.ok) {
        setReviewText("");
        setReviews(await res.json());
      } else {
        setReviewError("Failed to add review.");
      }
    } catch {
      setReviewError("Failed to add review.");
    }
    setSubmitting(false);
  };

  // Edit review
  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.text);
  };
  const handleEditReviewSubmit = async (reviewId) => {
    if (!editingReviewText.trim()) return;
    try {
      const res = await fetch(`${getApiUrl()}/clinics/${id}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ text: editingReviewText })
      });
      if (res.ok) {
        setReviews(await res.json());
        setEditingReviewId(null);
        setEditingReviewText("");
      }
    } catch {}
  };

  const handleFlagReview = async (review) => {
    try {
      await fetch(`${getApiUrl()}/clinics/${id}/reviews/${review.id}/flag`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setFlagged(f => ({ ...f, [review.id]: true }));
    } catch {}
  };

  const handleReplyReview = async (review) => {
    try {
      await fetch(`${getApiUrl()}/clinics/${id}/reviews/${review.id}/reply`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText[review.id] })
      });
      setReplyText(t => ({ ...t, [review.id]: '' }));
      // Refresh reviews
      const res = await fetch(`${getApiUrl()}/clinics/${id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch {}
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await fetch(`${getApiUrl()}/clinics/${id}/reviews/${review.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      // Refresh reviews
      const res = await fetch(`${getApiUrl()}/clinics/${id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!user?.token) return;
    try {
      const res = await fetchWithAuth(`${getApiUrl()}/user/favorites`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: id })
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch {}
  };

  // Render stars for rating
  const renderStars = (rating) => {
    if (rating == null || isNaN(rating)) return <span className="text-xs text-slate-400 ml-2">Not rated</span>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    return (
      <span className="flex items-center gap-0.5 ml-2">
        {[...Array(fullStars)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-base" />)}
        {halfStar && <FaStar className="text-yellow-300 text-base" style={{ opacity: 0.5 }} />}
        {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => <FaRegStar key={i} className="text-slate-300 text-base" />)}
        <span className="ml-1 text-xs text-slate-500">{rating.toFixed(1)}</span>
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!clinic) return <div className="p-8 text-center text-red-500">Clinic not found.</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8 mb-8">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <img src={clinic.image || "/placeholder.jpg"} alt={clinic.name} className="w-40 h-40 object-cover rounded-lg border" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 break-words max-w-full">{clinic.name}</h2>
            {clinic.verified && <FaCheckCircle className="text-green-500" title="Verified" />}
            {clinic.gmapLink && (
              <a href={clinic.gmapLink} target="_blank" rel="noopener noreferrer" title="View on Google Maps" className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-200 transition text-sm">
                <FaMapMarkedAlt className="text-blue-600 text-lg" />
                <span>View on Map</span>
              </a>
            )}
            {user && (
              <button onClick={handleToggleFavorite} className="ml-2 text-red-500 hover:text-red-700 flex items-center gap-1 text-lg font-semibold" title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FaMapMarkerAlt className="text-blue-500" />
            <span>{clinic.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Pincode:</span>
            <span>{clinic.pincode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Phone:</span>
            <span>{clinic.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Website:</span>
            {clinic.website ? <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{clinic.website}</a> : <span>-</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Timings:</span>
            <span className="flex flex-col">
              {clinic.timings && clinic.timings.split(',').map((t, i) => (
                <span key={i} className="text-xs text-slate-600">{t.trim()}</span>
              ))}
            </span>
          </div>
          <div className="flex items-center gap-2 text-base font-semibold mt-1">
            <span>Status:</span>
            <span className={clinic.status && clinic.status.toLowerCase() === 'operational' ? 'text-green-600' : 'text-red-600'}>
              {clinic.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">No. of Reviews:</span>
            <span>{clinic.noOfReviews || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Rating:</span>
            {renderStars(clinic.rating)}
          </div>
        </div>
      </div>
      {/* Reviews Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Reviews</h3>
        {user && (
          <div className="mb-4 flex flex-col gap-2">
            <textarea
              className="border rounded p-2 w-full"
              rows={3}
              placeholder="Write your review..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              disabled={submitting}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-max"
              onClick={handleAddReview}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Add Review"}
            </button>
            {reviewError && <div className="text-red-500 text-sm">{reviewError}</div>}
          </div>
        )}
        <div className="space-y-4">
          {reviews.length === 0 ? <div className="text-slate-400">No reviews yet.</div> : reviews.map((r, idx) => (
            <div key={r.id || idx} className={`bg-slate-50 rounded p-3 border ${r.flagged ? 'border-red-400 bg-red-50' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-800">{r.userName || "User"}</span>
                <span className="text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</span>
                {user && r.userId === user.uid && (
                  <>
                    <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => handleEditReview(r)} title="Edit"><FaEdit /></button>
                    <button className="ml-1 text-red-600 hover:text-red-800" onClick={() => handleDeleteReview(r)} title="Delete"><FaTrash /></button>
                  </>
                )}
                {user && !isAdmin && !r.flagged && (
                  <button className="ml-2 text-yellow-600 hover:text-yellow-800 text-xs font-semibold" onClick={() => handleFlagReview(r)} title="Flag as inappropriate">Flag</button>
                )}
                {isAdmin && (
                  <>
                    <button className="ml-2 text-green-600 hover:text-green-800 text-xs font-semibold" onClick={() => handleReplyReview(r)} title="Reply">Reply</button>
                    <input type="text" value={replyText[r.id] || ''} onChange={e => setReplyText(t => ({ ...t, [r.id]: e.target.value }))} placeholder="Type reply..." className="border rounded px-2 py-1 text-xs ml-2" />
                    <button className="ml-2 text-red-600 hover:text-red-800 text-xs font-semibold" onClick={() => handleDeleteReview(r)} title="Delete">Delete</button>
                  </>
                )}
              </div>
              {editingReviewId === r.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="border rounded p-2 w-full"
                    rows={2}
                    value={editingReviewText}
                    onChange={e => setEditingReviewText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm" onClick={() => handleEditReviewSubmit(r.id)}>Save</button>
                    <button className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-sm" onClick={() => setEditingReviewId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-700 text-sm">{r.text}</div>
              )}
              {r.reply && (
                <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <span className="font-semibold text-blue-700">Clinic Reply:</span> <span className="text-blue-800">{r.reply}</span>
                </div>
              )}
              {r.flagged && <div className="text-xs text-red-600 mt-1">This review has been flagged as inappropriate.</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage; 