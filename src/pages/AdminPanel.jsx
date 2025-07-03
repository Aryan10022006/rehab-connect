import React, { useRef, useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

const TABS = ["Statistics", "Manage Clinics", "Bulk Upload"];

const AdminPanel = () => {
  const [clinics, setClinics] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState("");
  const [verified, setVerified] = useState(false);
  const [surgeon, setSurgeon] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef();
  const [tab, setTab] = useState("Statistics");
  const [editClinic, setEditClinic] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const clinicChartRef = useRef();
  const areaChartRef = useRef();
  const userChartRef = useRef();
  const [stats, setStats] = useState({ clinicViews: {}, areaViews: {}, userStats: [], queryStats: {} });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clinics`);
      const data = await res.json();
      setClinics(data);
    } catch {
      setError("Failed to fetch clinics");
    }
    setLoading(false);
  };

  const getToken = () => localStorage.getItem("authToken");

  const handleAddClinic = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    const clinic = {
      name, address, location, lat: parseFloat(lat), lng: parseFloat(lng), phone, email, website,
      services: services.split(",").map(s => s.trim()), verified, surgeon, image
    };
    try {
      const res = await fetch(`${API_URL}/clinics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(clinic)
      });
      if (res.ok) {
        setMessage("Clinic added successfully!");
        fetchClinics();
        setName(""); setAddress(""); setLocation(""); setLat(""); setLng(""); setPhone(""); setEmail(""); setWebsite(""); setServices(""); setVerified(false); setSurgeon(""); setImage("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add clinic");
      }
    } catch {
      setError("Server error");
    }
  };

  const handleBulkUpload = (e) => {
    setError(""); setMessage("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const lines = evt.target.result.split("\n").filter(Boolean);
        const newClinics = lines.map(line => {
          const [name, address, location, lat, lng, phone, email, website, services, verified, surgeon, image] = line.split(",");
          return {
            name, address, location, lat: parseFloat(lat), lng: parseFloat(lng), phone, email, website,
            services: services.split(";").map(s => s.trim()), verified: verified === "true", surgeon, image
          };
        });
        const res = await fetch(`${API_URL}/clinics/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify(newClinics)
        });
        if (res.ok) {
          setMessage("Bulk clinics added!");
          fetchClinics();
        } else {
          const data = await res.json();
          setError(data.error || "Bulk add failed");
        }
      } catch {
        setError("Error parsing or uploading file");
      }
    };
    reader.readAsText(file);
  };

  const openEditModal = (clinic) => {
    setEditClinic(clinic);
    setName(clinic.name || "");
    setAddress(clinic.address || "");
    setLocation(clinic.location || "");
    setLat(clinic.lat || "");
    setLng(clinic.lng || "");
    setPhone(clinic.phone || "");
    setEmail(clinic.email || "");
    setWebsite(clinic.website || "");
    setServices((clinic.services || []).join(", "));
    setSurgeon(clinic.surgeon || "");
    setImage(clinic.image || "");
    setVerified(!!clinic.verified);
    setShowEditModal(true);
  };

  const handleUpdateClinic = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    const clinic = {
      name, address, location, lat: parseFloat(lat), lng: parseFloat(lng), phone, email, website,
      services: services.split(",").map(s => s.trim()), verified, surgeon, image
    };
    try {
      const res = await fetch(`${API_URL}/clinics/${editClinic.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(clinic)
      });
      if (res.ok) {
        setMessage("Clinic updated successfully!");
        fetchClinics();
        setName(""); setAddress(""); setLocation(""); setLat(""); setLng(""); setPhone(""); setEmail(""); setWebsite(""); setServices(""); setVerified(false); setSurgeon(""); setImage("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update clinic");
      }
    } catch {
      setError("Server error");
    }
    setShowEditModal(false);
    setEditClinic(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Admin Panel</h2>
        {message && <div className="mb-2 text-green-600">{message}</div>}
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <div className="flex gap-4 mb-6 border-b">
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 font-semibold ${tab===t ? 'border-b-4 border-blue-600 text-blue-700' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
        {tab === "Statistics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2 text-blue-800">Most Viewed Clinics</h3>
              <canvas ref={clinicChartRef} height={200}></canvas>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-800">Most Popular Areas</h3>
              <canvas ref={areaChartRef} height={200}></canvas>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-800">Most Active Users</h3>
              <canvas ref={userChartRef} height={200}></canvas>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-800">Most Common Queries</h3>
              <ol className="list-decimal pl-5">
                {Object.entries(stats.queryStats).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([q, count]) => (
                  <li key={q}>{q} <span className="text-xs text-slate-500">({count} times)</span></li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {tab === "Manage Clinics" && (
          <div>
            <form onSubmit={handleAddClinic} className="flex flex-col gap-3 mb-6">
              <div className="grid grid-cols-2 gap-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Clinic Name" className="border rounded-lg px-3 py-2 text-sm" required />
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="border rounded-lg px-3 py-2 text-sm" required />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City/Location" className="border rounded-lg px-3 py-2 text-sm" required />
                <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" className="border rounded-lg px-3 py-2 text-sm" required />
                <input value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude" className="border rounded-lg px-3 py-2 text-sm" required />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={services} onChange={e => setServices(e.target.value)} placeholder="Services (comma separated)" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={surgeon} onChange={e => setSurgeon(e.target.value)} placeholder="Surgeon" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image Path" className="border rounded-lg px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /> Verified</label>
              </div>
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700">Add Clinic</button>
            </form>
            <div>
              <h3 className="font-bold mb-2">Clinics List</h3>
              {loading ? <div>Loading...</div> : (
                <ul className="list-disc pl-5">
                  {clinics.map((c, i) => (
                    <li key={i}>{c.name} - {c.address}, {c.location} ({c.lat}, {c.lng}) <button className="ml-2 text-blue-600 underline text-xs" onClick={()=>openEditModal(c)}>Edit</button></li>
                  ))}
                </ul>
              )}
            </div>
            {showEditModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                  <h3 className="text-xl font-bold mb-4">Edit Clinic</h3>
                  <form onSubmit={handleUpdateClinic} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Clinic Name" className="border rounded-lg px-3 py-2 text-sm" required />
                      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="border rounded-lg px-3 py-2 text-sm" required />
                      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City/Location" className="border rounded-lg px-3 py-2 text-sm" required />
                      <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" className="border rounded-lg px-3 py-2 text-sm" required />
                      <input value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude" className="border rounded-lg px-3 py-2 text-sm" required />
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" />
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" />
                      <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" className="border rounded-lg px-3 py-2 text-sm" />
                      <input value={services} onChange={e => setServices(e.target.value)} placeholder="Services (comma separated)" className="border rounded-lg px-3 py-2 text-sm" />
                      <input value={surgeon} onChange={e => setSurgeon(e.target.value)} placeholder="Surgeon" className="border rounded-lg px-3 py-2 text-sm" />
                      <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image Path" className="border rounded-lg px-3 py-2 text-sm" />
                      <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /> Verified</label>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700">Save Changes</button>
                    <button type="button" className="mt-2 text-slate-500 underline" onClick={()=>setShowEditModal(false)}>Cancel</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "Bulk Upload" && (
          <div>
            <form className="mb-6">
              <label className="block mb-2 font-medium">Bulk Add Clinics (CSV: name,address,location,lat,lng,phone,email,website,services[; separated],verified,surgeon,image per line)</label>
              <input type="file" accept=".csv" ref={fileInput} onChange={handleBulkUpload} className="block" />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
