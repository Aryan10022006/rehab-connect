import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminPortal = () => {
  const navigate = useNavigate();
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState("");
  const nameRef = useRef();
  const addressRef = useRef();
  const pincodeRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  const handleAddClinic = (e) => {
    e.preventDefault();
    setMessage("Clinic added (demo only, not persisted)");
  };

  const handleBulkUpload = (e) => {
    e.preventDefault();
    setMessage("Bulk upload (demo only, not persisted)");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-bold mb-6">Admin Portal</h2>
      <form onSubmit={handleAddClinic} className="flex flex-col gap-2 w-96 bg-white p-6 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Add Single Clinic</h3>
        <input ref={nameRef} type="text" placeholder="Clinic Name" className="border rounded px-3 py-2" required />
        <input ref={addressRef} type="text" placeholder="Address" className="border rounded px-3 py-2" required />
        <input ref={pincodeRef} type="text" placeholder="Pincode" className="border rounded px-3 py-2" required />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Clinic</button>
      </form>
      <form onSubmit={handleBulkUpload} className="flex flex-col gap-2 w-96 bg-white p-6 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Bulk Upload Clinics (CSV)</h3>
        <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="border rounded px-3 py-2" required />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Upload CSV</button>
      </form>
      {message && <div className="text-green-600 mb-4">{message}</div>}
      <button className="text-blue-600 hover:underline" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AdminPortal; 