import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    users: [],
    clinics: [],
    transactions: [],
    analytics: {}
  });

  // Secure admin verification
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Check admin privileges
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${await currentUser.getIdToken()}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthorized(data.isAdmin);
          
          if (data.isAdmin) {
            await loadDashboardData();
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    verifyAdminAccess();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const [statsRes, usersRes, clinicsRes, transactionsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` }}),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` }}),
        fetch('/api/admin/clinics', { headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` }}),
        fetch('/api/admin/transactions', { headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` }}),
        fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` }})
      ]);

      const [stats, users, clinics, transactions, analytics] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        clinicsRes.json(),
        transactionsRes.json(),
        analyticsRes.json()
      ]);

      setDashboardData({ stats, users, clinics, transactions, analytics });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!currentUser || !isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-dashboard">
      {/* Secure Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1>🏥 RehabConnect Admin</h1>
            <span className="admin-badge">SECURE PANEL</span>
          </div>
          <div className="admin-user-info">
            <span>Welcome, {currentUser.displayName || currentUser.email}</span>
            <button className="logout-btn" onClick={() => window.location.href = '/admin/logout'}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <div className="nav-tabs">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'users', label: '👥 Users', icon: '👥' },
            { id: 'clinics', label: '🏥 Clinics', icon: '🏥' },
            { id: 'payments', label: '💳 Payments', icon: '💳' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' },
            { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
        {activeTab === 'users' && <UsersTab users={dashboardData.users} onRefresh={loadDashboardData} />}
        {activeTab === 'clinics' && <ClinicsTab clinics={dashboardData.clinics} onRefresh={loadDashboardData} />}
        {activeTab === 'payments' && <PaymentsTab transactions={dashboardData.transactions} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={dashboardData.analytics} />}
        {activeTab === 'settings' && <SettingsTab onRefresh={loadDashboardData} />}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => {
  const { stats } = data;

  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card users-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.totalUsers || 0}</div>
            <div className="stat-change positive">+{stats.newUsersToday || 0} today</div>
          </div>
        </div>

        <div className="stat-card premium-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Premium Users</h3>
            <div className="stat-number">{stats.premiumUsers || 0}</div>
            <div className="stat-change">{((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% conversion</div>
          </div>
        </div>

        <div className="stat-card clinics-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <h3>Active Clinics</h3>
            <div className="stat-number">{stats.totalClinics || 0}</div>
            <div className="stat-change positive">+{stats.newClinicsToday || 0} today</div>
          </div>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Monthly Revenue</h3>
            <div className="stat-number">₹{(stats.monthlyRevenue || 0).toLocaleString()}</div>
            <div className="stat-change positive">+{stats.revenueGrowth || 0}% vs last month</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>🔄 Recent Activity</h3>
        <div className="activity-list">
          {(stats.recentActivity || []).map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-icon">{activity.icon}</span>
              <span className="activity-text">{activity.text}</span>
              <span className="activity-time">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users Management Tab
const UsersTab = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.subscriptionStatus === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleUserAction = async (userId, action) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  return (
    <div className="users-tab">
      <div className="users-header">
        <h3>👥 User Management</h3>
        <div className="users-controls">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="active">Premium Active</option>
            <option value="expired">Premium Expired</option>
            <option value="free">Free Users</option>
          </select>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <img src={user.photoURL || '/default-avatar.png'} alt="" className="user-avatar" />
                    <span>{user.name || 'No Name'}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`plan-badge ${user.subscriptionStatus}`}>
                    {user.planType || 'Free'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleUserAction(user.id, 'suspend')}
                      className="action-btn suspend"
                      title="Suspend User"
                    >
                      ⏸️
                    </button>
                    <button
                      onClick={() => handleUserAction(user.id, 'premium')}
                      className="action-btn premium"
                      title="Grant Premium"
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => handleUserAction(user.id, 'delete')}
                      className="action-btn delete"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Clinics Management Tab
const ClinicsTab = ({ clinics, onRefresh }) => {
  const [selectedClinic, setSelectedClinic] = useState(null);

  const handleClinicAction = async (clinicId, action) => {
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Failed to ${action} clinic:`, error);
    }
  };

  return (
    <div className="clinics-tab">
      <div className="clinics-header">
        <h3>🏥 Clinic Management</h3>
        <button className="add-clinic-btn">+ Add New Clinic</button>
      </div>

      <div className="clinics-grid">
        {clinics.map(clinic => (
          <div key={clinic.id} className="clinic-card">
            <div className="clinic-image">
              <img src={clinic.images?.[0] || '/clinic-placeholder.jpg'} alt={clinic.name} />
              <div className="clinic-status">
                <span className={`status-indicator ${clinic.status}`}></span>
                {clinic.status}
              </div>
            </div>
            
            <div className="clinic-info">
              <h4>{clinic.name}</h4>
              <p className="clinic-address">{clinic.address}</p>
              <p className="clinic-specialization">{clinic.specialization}</p>
              
              <div className="clinic-stats">
                <span>⭐ {clinic.rating}/5</span>
                <span>👥 {clinic.reviewsCount} reviews</span>
                <span>📞 {clinic.contactNumber}</span>
              </div>
            </div>

            <div className="clinic-actions">
              <button
                onClick={() => setSelectedClinic(clinic)}
                className="action-btn edit"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleClinicAction(clinic.id, clinic.isActive ? 'deactivate' : 'activate')}
                className={`action-btn ${clinic.isActive ? 'deactivate' : 'activate'}`}
              >
                {clinic.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              <button
                onClick={() => handleClinicAction(clinic.id, 'delete')}
                className="action-btn delete"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Additional tabs would continue here...
// PaymentsTab, AnalyticsTab, SettingsTab

export default AdminDashboard;
