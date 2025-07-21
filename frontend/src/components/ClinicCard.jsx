import React from "react";
import { FaCheckCircle, FaLock, FaPhone, FaMapMarkerAlt, FaUserMd, FaStar, FaRegStar, FaMapMarkedAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClinicCard = ({ clinic, selected, onClick, locked, isFavorite, onFavorite }) => {
  const navigate = useNavigate();

  // Render stars for rating
  const renderStars = (rating) => {
    if (rating == null || isNaN(rating)) return <span className="text-xs text-slate-400 ml-2">Not rated</span>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    return (
      <span className="flex items-center gap-0.5 ml-2">
        {[...Array(fullStars)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-xs" />)}
        {halfStar && <FaStar className="text-yellow-300 text-xs" style={{ opacity: 0.5 }} />}
        {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => <FaRegStar key={i} className="text-slate-300 text-xs" />)}
        <span className="ml-1 text-xs text-slate-500">{rating.toFixed(1)}</span>
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl shadow hover:shadow-lg mb-4 cursor-pointer transition border-2 ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'} ${locked ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={() => navigate(`/clinic/${clinic.id}`)}
      style={{ maxWidth: '100%', minWidth: 0 }}
    >
      <img
        src={clinic.image || "/placeholder.jpg"}
        alt={clinic.name}
        className="w-20 h-20 object-cover rounded-lg border self-center md:self-auto flex-shrink-0"
        style={{ minWidth: 80, minHeight: 80 }}
      />
      <div className="flex-1 w-full flex flex-col gap-2 justify-between min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1 w-full justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-slate-800 min-w-0 truncate max-w-[180px] md:max-w-[220px]">{clinic.name}</h3>
            {renderStars(clinic.rating)}
            {clinic.gmapLink && (
              <a href={clinic.gmapLink} target="_blank" rel="noopener noreferrer" title="View on Map"><FaMapMarkedAlt className="text-blue-600 text-lg ml-2" /></a>
            )}
          </div>
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">{clinic.distance}</span>
          {!locked && onFavorite && (
            <button onClick={e => { e.stopPropagation(); onFavorite(clinic); }} className="ml-2 text-red-500 hover:text-red-700" title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
              {isFavorite ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm text-slate-700 min-w-0">
          <span className="flex items-center gap-2"><span className="font-medium">Pincode:</span> {clinic.pincode}</span>
          <span className="flex items-start gap-2"><FaMapMarkerAlt className="text-blue-500 mt-1 text-xl" /><span className="font-medium">Address:</span><span className="break-words max-w-[220px] md:max-w-[320px] truncate-2-lines" style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>{clinic.address}</span></span>
          <span className="flex items-center gap-2 mt-1"><span className="font-medium">Reviews:</span> {clinic.noOfReviews || 0}</span>
          {clinic.status && (
            <span className={`font-semibold text-xs mt-1 ${clinic.status.toLowerCase() === 'operational' ? 'text-green-600' : 'text-red-600'}`}>Status: {clinic.status}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicCard; 