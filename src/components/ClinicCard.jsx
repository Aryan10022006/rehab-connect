import React from "react";
import { FaCheckCircle, FaLock, FaPhone, FaMapMarkerAlt, FaGlobe, FaEnvelope } from "react-icons/fa";

const ClinicCard = ({ clinic, selected, onClick, locked }) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl shadow hover:shadow-lg mb-4 cursor-pointer transition border-2 ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'} ${locked ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={onClick}
    >
      <img
        src={clinic.image || "/placeholder.jpg"}
        alt={clinic.name}
        className="w-20 h-20 object-cover rounded-lg border"
      />
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg text-slate-800">{clinic.name}</h3>
          {clinic.verified && (
            <FaCheckCircle className="text-green-500" title="Verified" />
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-1">
          <span className="flex items-center gap-1"><FaMapMarkerAlt /> {clinic.address}</span>
          <span className="flex items-center gap-1"><FaPhone /> {clinic.phone}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-1">
          <a href={`mailto:${clinic.email}`} className="flex items-center gap-1 hover:underline"><FaEnvelope /> {clinic.email}</a>
          <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline"><FaGlobe /> Website</a>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {clinic.services && clinic.services.map((service, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{service}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 min-w-[60px]">
        <span className="text-xs text-slate-400 font-semibold">{clinic.distance}</span>
        {locked && (
          <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs"><FaLock /> Premium</div>
        )}
      </div>
    </div>
  );
};

export default ClinicCard; 