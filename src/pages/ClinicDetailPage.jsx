import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import clinicsData from "../data/clinics.json";
import { FaCheckCircle, FaPhone, FaMapMarkerAlt, FaUserMd, FaStar, FaRegStar } from "react-icons/fa";

const ClinicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const clinic = clinicsData.find(c => String(c.id) === String(id));
  if (!clinic) return <div className="p-8 text-center text-red-500">Clinic not found.</div>;

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

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8 mb-8">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <img src={clinic.image || "/placeholder.jpg"} alt={clinic.name} className="w-32 h-32 object-cover rounded-lg border" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{clinic.name}</h2>
            {clinic.verified && <FaCheckCircle className="text-green-500" title="Verified" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FaMapMarkerAlt className="text-blue-500" />
            <span>{clinic.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FaPhone className="text-blue-500" />
            <span>{clinic.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FaUserMd className="text-blue-500" />
            <span>{clinic.surgeon}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Pincode:</span>
            <span>{clinic.pincode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Services:</span>
            <span className="flex flex-wrap gap-2">
              {clinic.services && clinic.services.map((service, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{service}</span>
              ))}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Rating:</span>
            {renderStars(clinic.rating)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage; 