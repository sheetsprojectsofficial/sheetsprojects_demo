import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';

// Import tenant components
import {
  TenantFormModal,
  TenantCredentialsModal,
  TenantsDataGrid,
  TenantStatsCards,
  TenantSearchFilter,
  getInitialFormData,
  getInitialCredentialsData,
  CORE_FEATURES,
  DEFAULT_CUSTOMIZATION
} from './Tenants';

const SuperAdminTenants = () => {
  const { getToken } = useAuth();

  // Main data state
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [credentialsStatus, setCredentialsStatus] = useState(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData());
  const [newDomain, setNewDomain] = useState('');
  const [credentialsData, setCredentialsData] = useState(getInitialCredentialsData());

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await apiFetch('/tenants', {
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
  }, [getToken]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Filter tenants based on search and status
  const filteredTenants = useMemo(() => {
    let result = tenants;

    if (statusFilter !== 'all') {
      result = result.filter(t =>
        statusFilter === 'active' ? t.isActive : !t.isActive
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.ownerEmail?.toLowerCase().includes(q) ||
        t.ownerName?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tenants, statusFilter, searchQuery]);

  // CRUD Operations
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await apiFetch('/tenants', {
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
      const response = await apiFetch(`/tenants/${editingTenant.id}`, {
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
      const response = await apiFetch(`/tenants/${selectedTenant.id}/credentials`, {
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
      const response = await apiFetch(`/tenants/${tenant.id}/toggle-status`, {
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
      const response = await apiFetch(`/tenants/${tenant.id}`, {
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

  // Modal handlers
  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      ownerName: tenant.ownerName || '',
      ownerEmail: tenant.ownerEmail,
      phone: tenant.phone || '',
      customDomain: tenant.customDomain || '',
      frontendDomains: tenant.frontendDomains || [],
      features: tenant.features || {}
    });
    setNewDomain('');
    setShowModal(true);
  };

  const openCredentialsModal = async (tenant) => {
    setSelectedTenant(tenant);
    setLoadingCredentials(true);
    setCredentialsStatus(null);
    setCredentialsData(getInitialCredentialsData());
    setShowCredentialsModal(true);

    try {
      const token = await getToken();
      const response = await apiFetch(`/tenants/${tenant.id}/credentials-status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCredentialsStatus(data.status);
        // Pre-fill form with fetched values
        setCredentialsData({
          firebase: {
            apiKey: data.status.firebase?.apiKey || '',
            authDomain: data.status.firebase?.authDomain || '',
            projectId: data.status.firebase?.projectId || '',
            storageBucket: data.status.firebase?.storageBucket || '',
            clientEmail: data.status.firebase?.clientEmail || '',
            privateKey: data.status.firebase?.privateKey || ''
          },
          mongodb: {
            uri: data.status.mongodb?.uri || ''
          },
          razorpay: {
            keyId: data.status.razorpay?.keyId || '',
            secretKey: data.status.razorpay?.secretKey || ''
          },
          email: {
            user: data.status.email?.user || '',
            password: data.status.email?.password || ''
          },
          googleSheets: {
            productsSheetId: data.status.googleSheets?.productsSheetId || '',
            settingsSheetId: data.status.googleSheets?.settingsSheetId || '',
            settingsSheetName: data.status.googleSheets?.settingsSheetName || 'Settings',
            blogsFolderId: data.status.googleSheets?.blogsFolderId || '',
            booksFolderId: data.status.googleSheets?.booksFolderId || '',
            contactSheetId: data.status.googleSheets?.contactSheetId || '',
            bookingsSheetId: data.status.googleSheets?.bookingsSheetId || '',
            webinarSheetId: data.status.googleSheets?.webinarSheetId || '',
            portfolioTemplatesFolderId: data.status.googleSheets?.portfolioTemplatesFolderId || ''
          },
          cloudinary: {
            cloudName: data.status.cloudinary?.cloudName || '',
            apiKey: data.status.cloudinary?.apiKey || '',
            apiSecret: data.status.cloudinary?.apiSecret || ''
          },
          recaptcha: {
            siteKey: data.status.recaptcha?.siteKey || '',
            secretKey: data.status.recaptcha?.secretKey || ''
          },
          policyDocs: {
            aboutUsDocId: data.status.policyDocs?.aboutUsDocId || '',
            shippingPolicyDocId: data.status.policyDocs?.shippingPolicyDocId || '',
            termsConditionsDocId: data.status.policyDocs?.termsConditionsDocId || '',
            cancellationsRefundsDocId: data.status.policyDocs?.cancellationsRefundsDocId || '',
            privacyPolicyDocId: data.status.policyDocs?.privacyPolicyDocId || '',
            refundPolicyDocId: data.status.policyDocs?.refundPolicyDocId || '',
            pricingPolicyDocId: data.status.policyDocs?.pricingPolicyDocId || ''
          },
          bookingCalendars: {
            room1CalendarId: data.status.bookingCalendars?.room1CalendarId || '',
            room2CalendarId: data.status.bookingCalendars?.room2CalendarId || '',
            room3CalendarId: data.status.bookingCalendars?.room3CalendarId || ''
          },
          googleApis: {
            customSearchApiKey: data.status.googleApis?.customSearchApiKey || '',
            searchEngineId: data.status.googleApis?.searchEngineId || '',
            geminiApiKey: data.status.googleApis?.geminiApiKey || '',
            driveApiKey: data.status.googleApis?.driveApiKey || ''
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch credentials status:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setNewDomain('');
  };

  const openAddModal = () => {
    setEditingTenant(null);
    resetForm();
    setShowModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Error state
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients (Tenants)</h2>
          <p className="text-gray-500 mt-1">
            {filteredTenants.length} client{filteredTenants.length !== 1 ? 's' : ''}
            {searchQuery || statusFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <TenantStatsCards tenants={tenants} />

      {/* Search and Filter */}
      <TenantSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* DataGrid Table */}
      <TenantsDataGrid
        tenants={filteredTenants}
        loading={loading}
        onCredentials={openCredentialsModal}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteTenant}
      />

      {/* Create/Edit Modal */}
      <TenantFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        editingTenant={editingTenant}
        formData={formData}
        setFormData={setFormData}
        newDomain={newDomain}
        setNewDomain={setNewDomain}
        onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant}
      />

      {/* Credentials Modal */}
      <TenantCredentialsModal
        show={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        selectedTenant={selectedTenant}
        credentialsData={credentialsData}
        setCredentialsData={setCredentialsData}
        credentialsStatus={credentialsStatus}
        loadingCredentials={loadingCredentials}
        onSubmit={handleUpdateCredentials}
      />
    </div>
  );
};

export default SuperAdminTenants;
