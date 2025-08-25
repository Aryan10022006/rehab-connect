import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getApiUrl, fetchWithAuth } from '../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaCheckCircle,
  FaTimes,
  FaSave,
  FaUpload
} from 'react-icons/fa';

const AdminClinicManagement = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [state, setState] = useState({
    clinics: [],
    loading: true,
    error: null,
    searchTerm: '',
    selectedClinic: null,
    showAddModal: false,
    showEditModal: false,
    showDeleteModal: false,
    editingClinic: null
  });

  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: '',
    long: '',
    phone: '',
    email: '',
    website: '',
    timings: '',
    status: 'OPERATIONAL',
    verified: false,
    rating: 0,
    noOfReviews: 0
  });

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetchWithAuth(`${getApiUrl()}/admin/clinics`);
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          clinics: data.clinics || [],
          loading: false 
        }));
      } else {
        throw new Error(data.error || 'Failed to load clinics');
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };

  const handleAddClinic = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetchWithAuth(`${getApiUrl()}/admin/clinics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClinic)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Clinic added successfully');
        setState(prev => ({ 
          ...prev, 
          showAddModal: false,
          clinics: [...prev.clinics, data.clinic]
        }));
        setNewClinic({
          name: '', address: '', city: '', state: '', pincode: '',
          lat: '', long: '', phone: '', email: '', website: '',
          timings: '', status: 'OPERATIONAL', verified: false,
          rating: 0, noOfReviews: 0
        });
      } else {
        throw new Error(data.error || 'Failed to add clinic');
      }
    } catch (error) {
      console.error('Error adding clinic:', error);
      showError(error.message);
    }
  };

  const handleEditClinic = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetchWithAuth(`${getApiUrl()}/admin/clinics/${state.editingClinic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.editingClinic)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Clinic updated successfully');
        setState(prev => ({ 
          ...prev, 
          showEditModal: false,
          editingClinic: null,
          clinics: prev.clinics.map(c => 
            c.id === data.clinic.id ? data.clinic : c
          )
        }));
      } else {
        throw new Error(data.error || 'Failed to update clinic');
      }
    } catch (error) {
      console.error('Error updating clinic:', error);
      showError(error.message);
    }
  };

  const handleDeleteClinic = async () => {
    try {
      const response = await fetchWithAuth(`${getApiUrl()}/admin/clinics/${state.selectedClinic.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Clinic deleted successfully');
        setState(prev => ({ 
          ...prev, 
          showDeleteModal: false,
          selectedClinic: null,
          clinics: prev.clinics.filter(c => c.id !== prev.selectedClinic.id)
        }));
      } else {
        throw new Error(data.error || 'Failed to delete clinic');
      }
    } catch (error) {
      console.error('Error deleting clinic:', error);
      showError(error.message);
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetchWithAuth(`${getApiUrl()}/admin/clinics/bulk-upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully uploaded ${data.count} clinics`);
        loadClinics();
      } else {
        throw new Error(data.error || 'Failed to upload clinics');
      }
    } catch (error) {
      console.error('Error uploading clinics:', error);
      showError(error.message);
    }
  };

  const filteredClinics = state.clinics.filter(clinic =>
    clinic.name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    clinic.address?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    clinic.pincode?.includes(state.searchTerm)
  );

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
              <p className="text-gray-600 mt-1">Manage clinic database and information</p>
            </div>
            
            <div className="flex gap-3">
              <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2">
                <FaUpload />
                Bulk Upload
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleBulkUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={() => setState(prev => ({ ...prev, showAddModal: true }))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaPlus />
                Add Clinic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics by name, address, or pincode..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              All Clinics ({filteredClinics.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {clinic.name}
                          </div>
                          {clinic.verified && (
                            <FaCheckCircle className="ml-2 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Rating: {clinic.rating || 0} ({clinic.noOfReviews || 0} reviews)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{clinic.city}</div>
                      <div className="text-sm text-gray-500">{clinic.pincode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{clinic.phone}</div>
                      <div className="text-sm text-gray-500">{clinic.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        clinic.status === 'OPERATIONAL' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {clinic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setState(prev => ({ ...prev, selectedClinic: clinic }))}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            showEditModal: true,
                            editingClinic: { ...clinic }
                          }))}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            showDeleteModal: true,
                            selectedClinic: clinic
                          }))}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Clinic Modal */}
      {state.showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Clinic</h3>
                <button
                  onClick={() => setState(prev => ({ ...prev, showAddModal: false }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleAddClinic} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newClinic.name}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newClinic.phone}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={newClinic.address}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newClinic.city}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={newClinic.pincode}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, pincode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newClinic.status}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="OPERATIONAL">Operational</option>
                      <option value="CLOSED">Closed</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newClinic.verified}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, verified: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Verified</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, showAddModal: false }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Clinic
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar structure to Add Modal */}
      {/* Delete Confirmation Modal */}
      {state.showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delete Clinic</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{state.selectedClinic?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setState(prev => ({ ...prev, showDeleteModal: false, selectedClinic: null }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClinic}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClinicManagement;
