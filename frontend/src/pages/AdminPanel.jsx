import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { db } from "../config/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Papa from 'papaparse';
import apiService from '../utils/apiService';

const COLORS = ["#2563eb", "#10b981", "#f59e42", "#ef4444", "#6366f1", "#fbbf24", "#14b8a6", "#a21caf"];

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
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalClinics: 0,
    totalReviews: 0,
    premiumUsers: 0,
    verifiedClinics: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch clinics
        const clinicsSnap = await getDocs(collection(db, "clinics"));
        const clinics = clinicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch reviews
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calculate system stats
        const premiumCount = users.filter(u => u.isPremium || u.role === 'premium').length;
        const verifiedCount = clinics.filter(c => c.verified).length;
        const activeCount = users.filter(u => u.status !== 'blocked').length;
        
        setSystemStats({
          totalUsers: users.length,
          totalClinics: clinics.length,
          totalReviews: reviews.length,
          premiumUsers: premiumCount,
          verifiedClinics: verifiedCount,
          activeUsers: activeCount
        });
        
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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
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
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>
      
      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{systemStats.totalClinics}</div>
          <div className="text-sm text-gray-600">Total Clinics</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{systemStats.totalReviews}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-yellow-600">{systemStats.premiumUsers}</div>
          <div className="text-sm text-gray-600">Premium Users</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{systemStats.verifiedClinics}</div>
          <div className="text-sm text-gray-600">Verified Clinics</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{systemStats.activeUsers}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
      </div>
      
      {/* Charts */}
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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [blockLoading, setBlockLoading] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [editSuccess]);

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    setDeleteLoading(userId);
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users => users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
    setDeleteLoading(null);
  };

  // Block/Unblock user
  const handleToggleUserStatus = async (userId, currentStatus, userName) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'block' : 'unblock';
    
    if (!window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) return;
    setBlockLoading(userId);
    
    try {
      const userRef = doc(db, "users", userId);
      await userRef.update({ 
        status: newStatus,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: 'admin'
      });
      setUsers(users => users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user`);
    }
    setBlockLoading(null);
  };

  // Open edit modal
  const handleEditUser = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      area: user.area || user.location || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: user.status || 'active',
      preferences: user.preferences || {},
      notes: user.notes || ''
    });
    setEditModalOpen(true);
    setEditError("");
    setEditSuccess("");
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    try {
      const userRef = doc(db, "users", editUser.id);
      const updateData = {
        ...editForm,
        updatedAt: new Date(),
        updatedBy: 'admin'
      };
      
      await userRef.update(updateData);
      
      setUsers(users => users.map(u => 
        u.id === editUser.id ? { ...u, ...updateData } : u
      ));
      
      setEditSuccess("User updated successfully!");
      setTimeout(() => {
        setEditModalOpen(false);
        setEditSuccess("");
      }, 1500);
    } catch (error) {
      console.error("Error updating user:", error);
      setEditError("Failed to update user: " + error.message);
    }
    setEditLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
        <div className="text-sm text-gray-600">
          Total Users: {users.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-lg">No users found in the system.</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || "No Name"}</div>
                          <div className="text-sm text-gray-500">{user.email || "No Email"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || "No Phone"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.area || user.location || "No Location"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.status, user.name || user.email)}
                        disabled={blockLoading === user.id}
                        className={`${
                          user.status === 'blocked' ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'
                        } disabled:opacity-50`}
                      >
                        {blockLoading === user.id ? 'Processing...' : user.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                        disabled={deleteLoading === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit User: {editUser.name || editUser.email}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="premium">Premium User</option>
                  <option value="provider">Healthcare Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows="3"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes about this user..."
                />
              </div>
              {editError && <div className="text-red-600 font-medium">{editError}</div>}
              {editSuccess && <div className="text-green-600 font-medium">{editSuccess}</div>}
              <div className="flex gap-4 mt-6">
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold" 
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 font-semibold" 
                  onClick={() => setEditModalOpen(false)} 
                  disabled={editLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
          const response = await fetch(`${apiService.getBaseUrl()}/clinics/bulk`, {
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
      const response = await fetch(`${apiService.getBaseUrl()}/clinics/${editClinic.id}`, {
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
      const response = await fetch(`${apiService.getBaseUrl()}/clinics/${clinic.id}`, {
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

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        const reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort by creation date (newest first)
        reviewsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    setDeleteLoading(reviewId);
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      setReviews(reviews => reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
    setDeleteLoading(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reviews Management</h2>
        <div className="text-sm text-gray-600">
          Total Reviews: {reviews.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading reviews...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-lg">No reviews found in the system.</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 line-clamp-3">
                          {review.comment || "No comment"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {review.clinicName || review.clinicId || "Unknown Clinic"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex">
                          {renderStars(review.rating || 0)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating || 0}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {review.reviewerName || "Anonymous"}
                      </div>
                      {review.anonymous && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Anonymous
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deleteLoading === review.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleteLoading === review.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const inactivityTimeout = 60 * 60 * 1000; // 1 hour in ms
  const timerRef = useRef();

  // Helper to logout
  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_login_time");
    navigate("/secure-admin-portal-2024", { state: { usr: { expired: true } } });
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
      navigate("/secure-admin-portal-2024");
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
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;
