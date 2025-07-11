import React from "react";
import { FaCheckCircle, FaLock, FaPhone, FaMapMarkerAlt, FaUserMd, FaStar, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClinicCard = ({ clinic, selected, onClick, locked }) => {
  const mainServices = clinic.services ? clinic.services.slice(0, 2) : [];
  const extraServices = clinic.services ? clinic.services.slice(2) : [];
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
    >
      <img
        src={clinic.image || "/placeholder.jpg"}
        alt={clinic.name}
        className="w-20 h-20 object-cover rounded-lg border self-center md:self-auto"
      />
      <div className="flex-1 w-full flex flex-col gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2 mb-1 w-full justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-slate-800 min-w-0 truncate">{clinic.name}</h3>
            {clinic.verified && (
              <FaCheckCircle className="text-green-500" title="Verified" />
            )}
            {locked && (
              <FaStar className="text-yellow-500 text-base" title="Premium" />
            )}
            {renderStars(clinic.rating)}
          </div>
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">{clinic.distance}</span>
        </div>
        <div className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="flex items-start gap-2"><FaMapMarkerAlt className="text-blue-500 mt-1" /><span className="font-medium">Address:</span><span className="break-words">{clinic.address}</span></span>
          <span className="flex items-center gap-2"><FaPhone className="text-blue-500" /><span className="font-medium">Phone:</span> {clinic.phone}</span>
          <span className="flex items-center gap-2"><FaUserMd className="text-blue-500" /><span className="font-medium">Surgeon:</span> {clinic.surgeon}</span>
          <span className="flex items-center gap-2"><span className="font-medium">Pincode:</span> {clinic.pincode}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {mainServices.map((service, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{service}</span>
          ))}
        </div>
        {extraServices.length > 0 && (
          <div className="flex gap-2 mt-1 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
            {extraServices.map((service, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">{service}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicCard; 