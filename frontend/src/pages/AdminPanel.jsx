import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { db } from "../config/firebase";
import { collection, getDocs, deleteDoc, doc, query, where, orderBy, limit } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Papa from 'papaparse';
import { getApiUrl } from '../utils/api';
import Footer from '../components/Footer';

const COLORS = ["#2563eb", "#10b981", "#f59e42", "#ef4444", "#6366f1", "#fbbf24", "#14b8a6", "#a21caf"];

const REQUIRED_FIELDS = [
  "name", "address", "latitude", "longitude", "phone", "rating", "bStatus", "timings", "gMapLink", "site", "noOfReviews"
  // Add more required fields as needed
];

const FIELD_MAP = {
  name: ["name", "Clinic Name"],
  pincode: ["pincode", "Pin Code"],
  address: ["address", "Address"],
  lat: ["lat", "latitude", "Latitude"],
  long: ["long", "longitude", "Longitude"],
  website: ["website", "site", "Site"],
  rating: ["rating", "Rating"],
  phone: ["phone", "Phone No.", "phone"],
  timings: ["timings", "Timings"],
  gmapLink: ["gMapLink", "Maps", "gmap link"],
  status: ["status", "bStatus", "Status"],
  verified: ["verified", "Verified"],
  noOfReviews: ["noOfReviews", "No of Reviews", "noOfReviews"]
};
const ALLOWED_FIELDS = Object.keys(FIELD_MAP);

// Helper to extract state from address
function extractState(address) {
  if (!address) return "Unknown";
  // Try to match common Indian state names (add more as needed)
  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh", "Andaman and Nicobar", "Dadra and Nagar Haveli", "Daman and Diu", "Lakshadweep"
  ];
  for (const state of states) {
    if (address.toLowerCase().includes(state.toLowerCase())) return state;
  }
  // Try to extract last word (often state)
  const parts = address.split(',').map(s => s.trim());
  if (parts.length > 1) return parts[parts.length - 1];
  return "Unknown";
}

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
      // Analytics: users by state
      const stateCount = {};
      users.forEach(u => {
        const state = extractState(u.address || u.location || "");
        stateCount[state] = (stateCount[state] || 0) + 1;
      });
      setUserStats(Object.entries(stateCount).map(([state, count]) => ({ state, count })));
      // Analytics: clinics by state
      const clinicStateCount = {};
      clinics.forEach(c => {
        const state = extractState(c.address || c.location || "");
        clinicStateCount[state] = (clinicStateCount[state] || 0) + 1;
      });
      setClinicStats(Object.entries(clinicStateCount).map(([state, count]) => ({ state, count })));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Group small states as 'Other' for clinics by state chart
  let displayClinicStats = clinicStats;
  if (clinicStats.length > 8) {
    const sorted = [...clinicStats].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 7);
    const otherCount = sorted.slice(7).reduce((sum, s) => sum + s.count, 0);
    displayClinicStats = [...top, { state: 'Other', count: otherCount }];
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-2">Users by State</h3>
          {loading ? <div>Loading...</div> : userStats.length === 0 ? <div className="text-gray-400">No data</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="state" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-2">Clinics by State</h3>
          {loading ? <div>Loading...</div> : clinicStats.length === 0 ? <div className="text-gray-400">No data</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={displayClinicStats} dataKey="count" nameKey="state" cx="50%" cy="50%" outerRadius={80} label>
                  {displayClinicStats.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
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
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [editClinic, setEditClinic] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(null);

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      const clinicsSnap = await getDocs(collection(db, "clinics"));
      setClinics(clinicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchClinics();
  }, [csvSuccess, bulkDeleteLoading]);

  // Delete a single clinic
  const handleDeleteClinic = async (id) => {
    if (!window.confirm("Are you sure you want to delete this clinic?")) return;
    await deleteDoc(doc(db, "clinics", id));
    setClinics(clinics => clinics.filter(c => c.id !== id));
  };

  // Bulk delete clinics uploaded in the last bulk upload (e.g., by createdBy or recent timestamp)
  const handleBulkDelete = async () => {
    if (!window.confirm("Are you sure you want to bulk delete the most recently uploaded clinics?")) return;
    setBulkDeleteLoading(true);
    // Example: delete clinics created in the last 10 minutes
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const q = query(collection(db, "clinics"), orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    const toDelete = snap.docs.filter(docSnap => {
      const createdAt = docSnap.data().createdAt;
      if (!createdAt) return false;
      const ts = createdAt.seconds ? createdAt.seconds * 1000 : new Date(createdAt).getTime();
      return ts > tenMinutesAgo;
    });
    await Promise.all(toDelete.map(docSnap => deleteDoc(doc(db, "clinics", docSnap.id))));
    setBulkDeleteLoading(false);
    setCsvSuccess("Bulk deleted " + toDelete.length + " clinics.");
  };

  // Helper to extract lat/lng from Google Maps link
  const extractLatLng = (mapsUrl) => {
    if (!mapsUrl) return { lat: '', lng: '' };
    // Try to match @lat,lng or q=lat,lng
    const atMatch = mapsUrl.match(/@([\d.\-]+),([\d.\-]+)/);
    if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };
    const qMatch = mapsUrl.match(/q=([\d.\-]+),([\d.\-]+)/);
    if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };
    return { lat: '', lng: '' };
  };

  // Handle CSV upload
  const handleCsvUpload = async (e) => {
    setCsvError(""); setCsvSuccess("");
    const file = e.target.files[0];
    if (!file) return;
    setCsvUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const clinicsToUpload = results.data.map(row => {
            const mapped = {};
            for (const [key, aliases] of Object.entries(FIELD_MAP)) {
              for (const alias of aliases) {
                if (row[alias] !== undefined && row[alias] !== null) {
                  mapped[key] = row[alias];
                  break;
                }
              }
              if (mapped[key] === undefined) mapped[key] = "";
            }
            // Normalize lat/long
            mapped.lat = mapped.lat ? parseFloat(mapped.lat) : "";
            mapped.long = mapped.long ? parseFloat(mapped.long) : "";
            mapped.rating = mapped.rating ? parseFloat(mapped.rating) : "";
            mapped.noOfReviews = mapped.noOfReviews ? parseInt(mapped.noOfReviews) : "";
            mapped.verified = mapped.verified === true || mapped.verified === "true";
            mapped.status = mapped.status || "OPERATIONAL";
            if (typeof mapped.timings === "string") {
              mapped.timings = mapped.timings.split(",").map(s => s.trim()).join(", ");
            }
            // Only include allowed fields
            const finalClinic = {};
            ALLOWED_FIELDS.forEach(f => finalClinic[f] = mapped[f]);
            return finalClinic;
          });
          const adminEmail = localStorage.getItem("admin_email");
          const response = await fetch(`${getApiUrl()}/clinics/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminEmail}`
            },
            body: JSON.stringify(clinicsToUpload)
          });
          let data;
          try {
            data = await response.json();
          } catch (err) {
            setCsvError("Bulk upload failed. Server did not return valid JSON.");
            setCsvUploading(false);
            return;
          }
          if (response.ok) {
            setCsvSuccess("Clinics uploaded successfully!");
          } else {
            setCsvError(data.error || "Bulk upload failed");
          }
        } catch (err) {
          setCsvError("Bulk upload failed. " + err.message);
        }
        setCsvUploading(false);
      }
    });
  };

  // Edit handlers
  const handleEditClick = (clinic) => {
    setEditClinic(clinic);
    setEditForm(clinic);
    setEditModalOpen(true);
    setEditError("");
    setEditSuccess("");
  };
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const response = await fetch(`${getApiUrl()}/clinics/${editClinic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminEmail}`
        },
        body: JSON.stringify(editForm)
      });
      if (!response.ok) {
        const data = await response.json();
        setEditError(data.error || 'Failed to update clinic');
      } else {
        setEditSuccess('Clinic updated successfully!');
        setClinics(clinics => clinics.map(c => c.id === editClinic.id ? { ...c, ...editForm } : c));
        setTimeout(() => {
          setEditModalOpen(false);
        }, 1000);
      }
    } catch (err) {
      setEditError('Failed to update clinic. ' + err.message);
    }
    setEditLoading(false);
  };

  // Verify/unverify clinic
  const handleToggleVerify = async (clinic) => {
    setVerifyLoading(clinic.id);
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const response = await fetch(`${getApiUrl()}/clinics/${clinic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminEmail}`
        },
        body: JSON.stringify({ ...clinic, verified: !clinic.verified })
      });
      if (response.ok) {
        setClinics(clinics => clinics.map(c => c.id === clinic.id ? { ...c, verified: !clinic.verified } : c));
      }
    } catch {}
    setVerifyLoading(null);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Clinics</h2>
      <div className="mb-6">
        <label className="block font-semibold mb-2">Bulk Upload Clinics (CSV):</label>
        <input type="file" accept=".csv" onChange={handleCsvUpload} className="border rounded px-3 py-2" disabled={csvUploading} />
        {csvUploading && <div className="text-blue-600 mt-2">Uploading...</div>}
        {csvSuccess && <div className="text-green-600 mt-2">{csvSuccess}</div>}
        {csvError && <div className="text-red-600 mt-2">{csvError}</div>}
        <div className="text-xs text-gray-500 mt-1">Fields: Clinic Name, Prosthetic Head, Pin Code, Maps, Rating, Services (colon separated), Address, Phone No., City</div>
      </div>
      {loading ? <div>Loading...</div> : clinics.length === 0 ? <div className="text-gray-400">No clinics found.</div> : (
        <div className="overflow-x-auto">
          <button onClick={handleBulkDelete} className="mb-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" disabled={bulkDeleteLoading}>{bulkDeleteLoading ? "Deleting..." : "Bulk Delete Recent Clinics"}</button>
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Pincode</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Lat</th>
                <th className="px-4 py-2">Long</th>
                <th className="px-4 py-2">Website</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Timings</th>
                <th className="px-4 py-2">GMap Link</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Verified</th>
                <th className="px-4 py-2">No. of Reviews</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c, idx) => (
                <tr key={c.id || idx} className="border-t">
                  <td className="px-4 py-2">{c.name || "-"}</td>
                  <td className="px-4 py-2">{c.pincode || "-"}</td>
                  <td className="px-4 py-2">{c.address || "-"}</td>
                  <td className="px-4 py-2">{c.lat || "-"}</td>
                  <td className="px-4 py-2">{c.long || "-"}</td>
                  <td className="px-4 py-2">{c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Website</a> : "-"}</td>
                  <td className="px-4 py-2">{c.rating || "-"}</td>
                  <td className="px-4 py-2">{c.phone || "-"}</td>
                  <td className="px-4 py-2">{c.timings || "-"}</td>
                  <td className="px-4 py-2">{c.gmapLink ? <a href={c.gmapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Map</a> : "-"}</td>
                  <td className="px-4 py-2">{c.status || "-"}</td>
                  <td className="px-4 py-2">{c.verified ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{c.noOfReviews || "-"}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleEditClick(c)} className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700">Edit</button>
                    <button onClick={() => handleDeleteClinic(c.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700">Delete</button>
                    <button onClick={() => handleToggleVerify(c)} className={`px-2 py-1 rounded font-semibold ${c.verified ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`} disabled={verifyLoading === c.id}>
                      {verifyLoading === c.id ? '...' : c.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setEditModalOpen(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4">Edit Clinic</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {ALLOWED_FIELDS.map(field => (
                <div key={field} className="flex flex-col">
                  <label className="font-semibold mb-1 capitalize">{field}</label>
                  {field === 'verified' ? (
                    <input type="checkbox" name={field} checked={!!editForm[field]} onChange={handleEditChange} />
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={editForm[field] ?? ''}
                      onChange={handleEditChange}
                      className="border rounded px-3 py-2"
                    />
                  )}
                </div>
              ))}
              {editError && <div className="text-red-600 font-medium">{editError}</div>}
              {editSuccess && <div className="text-green-600 font-medium">{editSuccess}</div>}
              <div className="flex gap-4 mt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 font-semibold" onClick={() => setEditModalOpen(false)} disabled={editLoading}>Cancel</button>
              </div>
            </form>
          </div>
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
