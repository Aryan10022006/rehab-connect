import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ["#2563eb", "#10b981", "#f59e42", "#ef4444", "#6366f1", "#fbbf24", "#14b8a6", "#a21caf"];

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState([]);
  const [clinicStats, setClinicStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => doc.data());
      // Fetch clinics
      const clinicsSnap = await getDocs(collection(db, "clinics"));
      const clinics = clinicsSnap.docs.map(doc => doc.data());
      // Analytics: users by area
      const areaCount = {};
      users.forEach(u => {
        const area = u.area || u.location || "Unknown";
        areaCount[area] = (areaCount[area] || 0) + 1;
      });
      setUserStats(Object.entries(areaCount).map(([area, count]) => ({ area, count })));
      // Analytics: clinics by area
      const clinicAreaCount = {};
      clinics.forEach(c => {
        const area = c.location || c.area || "Unknown";
        clinicAreaCount[area] = (clinicAreaCount[area] || 0) + 1;
      });
      setClinicStats(Object.entries(clinicAreaCount).map(([area, count]) => ({ area, count })));
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-2">Users by Area</h3>
          {loading ? <div>Loading...</div> : userStats.length === 0 ? <div className="text-gray-400">No data</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="area" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-2">Clinics by Area</h3>
          {loading ? <div>Loading...</div> : clinicStats.length === 0 ? <div className="text-gray-400">No data</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={clinicStats} dataKey="count" nameKey="area" cx="50%" cy="50%" outerRadius={80} label>
                  {clinicStats.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(doc => doc.data()));
      setLoading(false);
    };
    fetchUsers();
  }, []);
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      {loading ? <div>Loading...</div> : users.length === 0 ? <div className="text-gray-400">No users found.</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{u.name || "-"}</td>
                  <td className="px-4 py-2">{u.email || "-"}</td>
                  <td className="px-4 py-2">{u.area || u.location || "-"}</td>
                  <td className="px-4 py-2">{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ClinicsManagement = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      const clinicsSnap = await getDocs(collection(db, "clinics"));
      setClinics(clinicsSnap.docs.map(doc => doc.data()));
      setLoading(false);
    };
    fetchClinics();
  }, []);
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Clinics</h2>
      {loading ? <div>Loading...</div> : clinics.length === 0 ? <div className="text-gray-400">No clinics found.</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Surgeon</th>
                <th className="px-4 py-2">Verified</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{c.name || "-"}</td>
                  <td className="px-4 py-2">{c.location || c.area || "-"}</td>
                  <td className="px-4 py-2">{c.surgeon || "-"}</td>
                  <td className="px-4 py-2">{c.verified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Settings = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4">Settings</h2>
    <div className="bg-white rounded shadow p-6">Settings coming soon.</div>
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const inactivityTimeout = 60 * 60 * 1000; // 1 hour in ms
  const timerRef = useRef();

  // Helper to logout
  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_login_time");
    navigate("/admin-secret-login", { state: { usr: { expired: true } } });
  };

  // Reset inactivity timer
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, inactivityTimeout);
    // Optionally, update login time to keep session alive
    localStorage.setItem("admin_login_time", Date.now().toString());
  };

  useEffect(() => {
    // Check if admin session exists on mount
    const admin = localStorage.getItem("admin");
    const loginTime = localStorage.getItem("admin_login_time");
    if (!admin || !loginTime) {
      navigate("/admin-secret-login");
      return;
    }
    // Start inactivity timer
    resetTimer();
    // Activity events
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    // Tab focus
    window.addEventListener("focus", resetTimer);
    // Clean up
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      window.removeEventListener("focus", resetTimer);
    };
    // eslint-disable-next-line
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="clinics" element={<ClinicsManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;
