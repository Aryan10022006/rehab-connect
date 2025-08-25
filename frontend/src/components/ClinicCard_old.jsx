import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaStar, FaHeart, FaGlobe, FaCheckCircle, FaClock, FaLock, FaDirections, FaRegHeart, FaRegStar } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const ClinicCard = ({ 
  clinic, 
  selected = false, 
  onClick, 
  locked = false, 
  isFavorite = false, 
  onFavorite,
  showDistance = true,
  isPremiumOnly = false,
  onUpgradeClick
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const navigate = useNavigate();

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favoriteLoading || locked || isPremiumOnly) return;
    
    setFavoriteLoading(true);
    try {
      if (onFavorite) {
        await onFavorite(clinic);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCardClick = () => {
    if (isPremiumOnly) {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }
    if (locked) return;
    if (onClick) {
      onClick();
    } else {
      navigate(`/clinic/${clinic.id}`);
    }
  };

  const renderStars = (rating) => {
    if (!rating || isNaN(rating)) return <span className="text-xs text-gray-400">Not rated</span>;
    
    const stars = [];
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-yellow-300 text-sm opacity-50" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300 text-sm" />);
      }
    }
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600 font-medium ml-1">
          {numRating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-sm border transition-all duration-300 group
        ${locked 
          ? 'cursor-not-allowed opacity-75 border-gray-200' 
          : isPremiumOnly
          ? 'cursor-pointer hover:shadow-xl border-yellow-200 bg-gradient-to-br from-white to-yellow-50/30'
          : 'cursor-pointer hover:shadow-lg border-gray-200 hover:border-blue-300 hover:-translate-y-1'
        }
        ${selected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''}
      `}
      onClick={handleCardClick}
    >
      
      {/* Premium overlay */}
      {isPremiumOnly && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl flex items-center justify-center z-10">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <FaLock className="text-base" />
            <div className="text-center">
              <div className="text-sm font-bold">Premium Access</div>
              <div className="text-xs opacity-90">Upgrade to View</div>
            </div>
          </div>
        </div>
      )}

      <div className={`p-6 ${isPremiumOnly ? 'filter blur-[1px]' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {clinic.name}
              </h3>
              {clinic.verified && (
                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                  <FaCheckCircle className="text-green-600 text-xs" />
                  <span className="text-green-700 text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-3">
              {renderStars(clinic.rating)}
              {clinic.noOfReviews && (
                <span className="text-sm text-gray-500">
                  ({clinic.noOfReviews} reviews)
                </span>
              )}
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={favoriteLoading || locked || isPremiumOnly}
            className={`p-2 rounded-full transition-all duration-200 ${
              favoriteLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : isFavorite
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {favoriteLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
            ) : isFavorite ? (
              <FaHeart className="w-5 h-5" />
            ) : (
              <FaRegHeart className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Clinic Information */}
        <div className="space-y-3 mb-4">
          {/* Address */}
          {clinic.address && (
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-gray-700 text-sm leading-relaxed">{clinic.address}</p>
                {clinic.pincode && (
                  <p className="text-gray-500 text-xs">PIN: {clinic.pincode}</p>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          {clinic.phone && (
            <div className="flex items-center gap-3">
              <FaPhone className="text-green-500 flex-shrink-0" />
              <a 
                href={`tel:${clinic.phone}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {clinic.phone}
              </a>
            </div>
          )}

          {/* Website */}
          {clinic.website && (
            <div className="flex items-center gap-3">
              <FaGlobe className="text-blue-500 flex-shrink-0" />
              <a 
                href={clinic.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website
              </a>
            </div>
          )}

          {/* Operating Hours */}
          {clinic.timings && (
            <div className="flex items-start gap-3">
              <FaClock className="text-purple-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-gray-700 text-sm font-medium">Operating Hours</p>
                <p className="text-gray-600 text-xs">{clinic.timings}</p>
              </div>
            </div>
          )}

          {/* Distance */}
          {showDistance && clinic.distance && (
            <div className="flex items-center gap-3">
              <FaDirections className="text-indigo-500 flex-shrink-0" />
              <span className="text-gray-700 text-sm">
                {typeof clinic.distance === 'number' 
                  ? `${clinic.distance.toFixed(1)} km away`
                  : clinic.distance
                }
              </span>
            </div>
          )}
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {clinic.status && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  clinic.status.toLowerCase() === 'operational' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  clinic.status.toLowerCase() === 'operational' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {clinic.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isPremiumOnly ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUpgradeClick) onUpgradeClick();
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:from-yellow-600 hover:to-orange-600 transition-all shadow-sm"
              >
                Upgrade to View
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/clinic/${clinic.id}`);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
            </div>
          </div>
        </div>
      )}

      {/* Locked overlay */}
      {locked && !isPremiumOnly && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-10 rounded-xl flex items-center justify-center z-10">
          <div className="bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-2 font-medium">
            <FaLock className="text-sm" />
            <span className="text-sm">Premium Feature</span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Clinic Image */}
        <div className="flex-shrink-0">
          <img
            src={clinic.image || `data:image/svg+xml;base64,${btoa('<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="#9ca3af" text-anchor="middle" dy=".3em">Clinic</text></svg>')}`}
            alt={clinic.name || "Clinic"}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.src = `data:image/svg+xml;base64,${btoa('<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="#9ca3af" text-anchor="middle" dy=".3em">No Image</text></svg>')}`;
            }}
          />
        </div>

        {/* Clinic Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {clinic.name || 'Unnamed Clinic'}
                </h3>
                {clinic.verified && (
                  <FaCheckCircle className="text-green-500 flex-shrink-0" title="Verified Clinic" />
                )}
              </div>
              
              {/* Rating */}
              {clinic.rating && (
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(clinic.rating)}
                  {clinic.noOfReviews > 0 && (
                    <span className="text-xs text-gray-500">
                      ({clinic.noOfReviews} review{clinic.noOfReviews !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Favorite button */}
            {!locked && (
              <button
                onClick={handleFavoriteClick}
                disabled={favoriteLoading}
                className={`
                  p-2 rounded-full transition-all duration-200 flex-shrink-0 ml-2
                  ${favoriteLoading 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:bg-red-50'
                  }
                `}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <FaHeart className="text-lg text-red-500" />
                ) : (
                  <FaRegHeart className="text-lg text-gray-400 hover:text-red-400" />
                )}
              </button>
            )}
          </div>

          {/* Clinic Info */}
          <div className="space-y-1 text-sm">
            {/* Pincode */}
            {clinic.pincode && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Pincode:</span>
                <span className="text-gray-700">{clinic.pincode}</span>
              </div>
            )}

            {/* Address */}
            {clinic.address && (
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 leading-relaxed line-clamp-2">{clinic.address}</span>
              </div>
            )}

            {/* Phone */}
            {clinic.phone && (
              <div className="flex items-center gap-2">
                <FaPhone className="text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{clinic.phone}</span>
              </div>
            )}

            {/* Status */}
            {clinic.status && (
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    clinic.status?.toLowerCase() === 'operational' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}
                />
                <span 
                  className={`text-xs font-medium ${
                    clinic.status?.toLowerCase() === 'operational' 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}
                >
                  {clinic.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Distance and Actions */}
        <div className="flex flex-col items-end justify-between gap-2">
          {/* Distance */}
          {showDistance && clinic.distance && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-blue-600">
                <FaDirections className="text-xs" />
                <span className="text-sm font-medium">{clinic.distance}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* View Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPremiumOnly) {
                  if (onUpgradeClick) onUpgradeClick();
                } else {
                  navigate(`/clinic/${clinic.id}`);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                isPremiumOnly 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
              }`}
            >
              <FaGlobe className="text-xs" />
              {isPremiumOnly ? 'Upgrade to View' : 'View Details'}
            </button>

            {/* Google Maps link */}
            {clinic.gmapLink && !locked && !isPremiumOnly && (
              <a
                href={clinic.gmapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-1 shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                <FaDirections className="text-xs" />
                Directions
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default ClinicCard; 