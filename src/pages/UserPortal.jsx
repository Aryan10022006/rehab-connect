import React from "react";
import { useNavigate } from "react-router-dom";
import clinicsData from "../data/clinics.json";
import ClinicCard from "../components/ClinicCard";
import { FaUserCircle } from "react-icons/fa";

function getUserEmail() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.credential) {
    try {
      const base64Url = user.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.email;
    } catch (e) { return null; }
  }
  return null;
}

const UserPortal = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  // Google credentialResponse contains id_token, not profile info. For demo, parse JWT to get name/email.
  let name = "";
  let email = "";
  if (user && user.credential) {
    try {
      const base64Url = user.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      name = payload.name;
      email = payload.email;
    } catch (e) {}
  }
  // Recently viewed clinics
  const userEmail = getUserEmail();
  const historyKey = `history_${userEmail}`;
  const historyIds = JSON.parse(localStorage.getItem(historyKey) || "[]");
  const recentClinics = historyIds.map(id => clinicsData.find(c => c.id === id)).filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <button onClick={() => navigate("/user")} className="mb-2"><FaUserCircle className="text-5xl text-blue-600" /></button>
      <h2 className="text-2xl font-bold mb-2">Welcome to Your Portal</h2>
      {user ? (
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-2 text-lg font-semibold">{name}</div>
          <div className="mb-2 text-slate-600">{email}</div>
        </div>
      ) : (
        <div className="mb-4 text-red-500">Not logged in.</div>
      )}
      <button className="mb-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold" onClick={() => navigate("/")}>Explore Clinics</button>
      <button className="text-blue-600 hover:underline mb-6" onClick={handleLogout}>Logout</button>
      <div className="w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-3">Recently Viewed Clinics</h3>
        {recentClinics.length === 0 ? (
          <div className="text-slate-400 text-center">No recently viewed clinics yet.</div>
        ) : (
          recentClinics.map(clinic => (
            <ClinicCard key={clinic.id} clinic={clinic} selected={false} onClick={() => navigate(`/clinic/${clinic.id}`)} locked={false} />
          ))
        )}
      </div>
    </div>
  );
};

export default UserPortal; 