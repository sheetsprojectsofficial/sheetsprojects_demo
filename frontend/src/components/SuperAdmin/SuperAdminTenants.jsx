import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const SuperAdminTenants = () => {
  const { getToken } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Form state for new/edit tenant
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    customDomain: '',
    frontendDomains: [],
    features: {
      products: true,
      books: true,
      blogs: true,
      bookings: true,
      payments: true,
      emailCampaigns: false,
      coldEmails: false,
      crm: false,
      webinar: false,
      cart: true,
      portfolio: true,
      chatbot: false
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logoUrl: '',
      faviconUrl: '',
      companyName: ''
    }
  });

  // New domain input state
  const [newDomain, setNewDomain] = useState('');

  // Credentials form state
  const [credentialsData, setCredentialsData] = useState({
    firebase: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      clientEmail: '',
      privateKey: ''
    },
    mongodb: {
      uri: ''
    },
    razorpay: {
      keyId: '',
      secretKey: ''
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    },
    googleSheets: {
      sheetId: '',
      settingsSheetId: '',
      settingsSheetName: 'Settings',
      blogsFolderId: '',
      booksFolderId: ''
    }
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTenants(data.tenants);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch tenants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        resetForm();
        fetchTenants();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to create tenant');
      console.error(err);
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingTenant(null);
        resetForm();
        fetchTenants();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to update tenant');
      console.error(err);
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants/${selectedTenant.id}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ credentials: credentialsData })
      });
      const data = await response.json();
      if (data.success) {
        setShowCredentialsModal(false);
        setSelectedTenant(null);
        alert('Credentials updated successfully');
        fetchTenants();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to update credentials');
      console.error(err);
    }
  };

  const handleToggleStatus = async (tenant) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants/${tenant.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchTenants();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to toggle tenant status');
      console.error(err);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/tenants/${tenant.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchTenants();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to delete tenant');
      console.error(err);
    }
  };

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      ownerName: tenant.ownerName || '',
      ownerEmail: tenant.ownerEmail,
      phone: tenant.phone || '',
      customDomain: tenant.customDomain || '',
      frontendDomains: tenant.frontendDomains || [],
      features: tenant.features || {},
      branding: tenant.branding || {}
    });
    setNewDomain('');
    setShowModal(true);
  };

  const addFrontendDomain = () => {
    if (newDomain.trim() && !formData.frontendDomains.includes(newDomain.trim())) {
      setFormData({
        ...formData,
        frontendDomains: [...formData.frontendDomains, newDomain.trim()]
      });
      setNewDomain('');
    }
  };

  const removeFrontendDomain = (domain) => {
    setFormData({
      ...formData,
      frontendDomains: formData.frontendDomains.filter(d => d !== domain)
    });
  };

  const openCredentialsModal = (tenant) => {
    setSelectedTenant(tenant);
    // Reset credentials form
    setCredentialsData({
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        clientEmail: '',
        privateKey: ''
      },
      mongodb: {
        uri: ''
      },
      razorpay: {
        keyId: '',
        secretKey: ''
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: ''
      },
      googleSheets: {
        sheetId: '',
        settingsSheetId: '',
        settingsSheetName: 'Settings',
        blogsFolderId: '',
        booksFolderId: ''
      }
    });
    setShowCredentialsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      customDomain: '',
      frontendDomains: [],
      features: {
        products: true,
        books: true,
        blogs: true,
        bookings: true,
        payments: true,
        emailCampaigns: false,
        coldEmails: false,
        crm: false,
        webinar: false,
        cart: true,
        portfolio: true,
        chatbot: false
      },
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logoUrl: '',
        faviconUrl: '',
        companyName: ''
      }
    });
    setNewDomain('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchTenants}
          className="mt-2 text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients (Tenants)</h2>
          <p className="text-gray-500 mt-1">Manage your SaaS clients and their configurations</p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Clients</p>
          <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Active Clients</p>
          <p className="text-2xl font-bold text-green-600">
            {tenants.filter(t => t.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Inactive Clients</p>
          <p className="text-2xl font-bold text-red-600">
            {tenants.filter(t => !t.isActive).length}
          </p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No clients yet. Click "Add Client" to create your first client.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600">
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.ownerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                      {tenant.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openCredentialsModal(tenant)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Configure Credentials"
                    >
                      <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEditModal(tenant)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit"
                    >
                      <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(tenant)}
                      className={tenant.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                      title={tenant.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {tenant.isActive ? (
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteTenant(tenant)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTenant ? 'Edit Client' : 'Add New Client'}
                </h3>
              </div>
              <form onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant}>
                <div className="px-6 py-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client/Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ABC Store"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="owner@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (optional)</label>
                    <input
                      type="text"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="client.example.com"
                    />
                  </div>

                  {/* Frontend Domains (for CORS) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frontend Domains (for CORS)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Add all frontend URLs that will access this client's API (production, staging, localhost)
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFrontendDomain())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://client-site.netlify.app"
                      />
                      <button
                        type="button"
                        onClick={addFrontendDomain}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {formData.frontendDomains.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.frontendDomains.map((domain, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {domain}
                            <button
                              type="button"
                              onClick={() => removeFrontendDomain(domain)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(formData.features).map((feature) => (
                        <label key={feature} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.features[feature]}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, [feature]: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 capitalize">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Branding */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branding</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={formData.branding.primaryColor || '#3B82F6'}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, primaryColor: e.target.value }
                          })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={formData.branding.companyName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, companyName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Company Name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingTenant ? 'Update Client' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCredentialsModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Configure Credentials - {selectedTenant.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the credentials for this client's services
                </p>
              </div>
              <form onSubmit={handleUpdateCredentials}>
                <div className="px-6 py-4 space-y-6">
                  {/* Firebase */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Firebase Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="API Key"
                        value={credentialsData.firebase.apiKey}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, apiKey: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Auth Domain"
                        value={credentialsData.firebase.authDomain}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, authDomain: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Project ID"
                        value={credentialsData.firebase.projectId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, projectId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Storage Bucket"
                        value={credentialsData.firebase.storageBucket}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, storageBucket: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Client Email (Service Account)"
                        value={credentialsData.firebase.clientEmail}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, clientEmail: e.target.value }
                        })}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <textarea
                        placeholder="Private Key (from service account JSON)"
                        value={credentialsData.firebase.privateKey}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          firebase: { ...credentialsData.firebase, privateKey: e.target.value }
                        })}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm h-20"
                      />
                    </div>
                  </div>

                  {/* MongoDB */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">MongoDB Configuration</h4>
                    <input
                      type="text"
                      placeholder="MongoDB Connection URI"
                      value={credentialsData.mongodb.uri}
                      onChange={(e) => setCredentialsData({
                        ...credentialsData,
                        mongodb: { uri: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {/* Razorpay */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Razorpay Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Key ID"
                        value={credentialsData.razorpay.keyId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          razorpay: { ...credentialsData.razorpay, keyId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Secret Key"
                        value={credentialsData.razorpay.secretKey}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          razorpay: { ...credentialsData.razorpay, secretKey: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Email Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="SMTP Host"
                        value={credentialsData.email.smtpHost}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, smtpHost: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="SMTP Port"
                        value={credentialsData.email.smtpPort}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, smtpPort: parseInt(e.target.value) }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="SMTP User"
                        value={credentialsData.email.smtpUser}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, smtpUser: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="password"
                        placeholder="SMTP Password"
                        value={credentialsData.email.smtpPassword}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, smtpPassword: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="From Email"
                        value={credentialsData.email.fromEmail}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, fromEmail: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="From Name"
                        value={credentialsData.email.fromName}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          email: { ...credentialsData.email, fromName: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Google Sheets */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Google Sheets Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Products Sheet ID"
                        value={credentialsData.googleSheets.sheetId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          googleSheets: { ...credentialsData.googleSheets, sheetId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Settings Sheet ID"
                        value={credentialsData.googleSheets.settingsSheetId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          googleSheets: { ...credentialsData.googleSheets, settingsSheetId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Blogs Drive Folder ID"
                        value={credentialsData.googleSheets.blogsFolderId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          googleSheets: { ...credentialsData.googleSheets, blogsFolderId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Books Drive Folder ID"
                        value={credentialsData.googleSheets.booksFolderId}
                        onChange={(e) => setCredentialsData({
                          ...credentialsData,
                          googleSheets: { ...credentialsData.googleSheets, booksFolderId: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCredentialsModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Save Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTenants;
