import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const TenantContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

// Get tenant slug from environment or URL
const getTenantSlug = () => {
  // Priority 1: Environment variable
  if (import.meta.env.VITE_TENANT_SLUG) {
    return import.meta.env.VITE_TENANT_SLUG;
  }

  // Priority 2: URL hostname (for custom domains)
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
    // Check if it's a known subdomain pattern (e.g., tenant.example.com)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      // Could be a subdomain setup
      return parts[0];
    }
  }

  // Priority 3: Query parameter (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tenant')) {
    return urlParams.get('tenant');
  }

  // Default: null (no tenant, use default configuration)
  return null;
};

export const TenantProvider = ({ children }) => {
  const [tenantSlug, setTenantSlug] = useState(getTenantSlug());
  const [tenantConfig, setTenantConfig] = useState(null);
  const [tenantFirebaseApp, setTenantFirebaseApp] = useState(null);
  const [tenantAuth, setTenantAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTenantConfig = async () => {
      if (!tenantSlug) {
        // No tenant - use default configuration
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch tenant config from API
        const response = await fetch(`${API_BASE_URL}/tenants/config`, {
          headers: {
            'X-Tenant-Slug': tenantSlug
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenant configuration');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Tenant not found');
        }

        setTenantConfig(data.config);

        // Initialize Firebase for this tenant if config exists
        if (data.config.firebase) {
          await initializeTenantFirebase(data.config.firebase);
        }

      } catch (err) {
        console.error('Error loading tenant config:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTenantConfig();

    // Cleanup on unmount
    return () => {
      if (tenantFirebaseApp) {
        deleteApp(tenantFirebaseApp).catch(console.error);
      }
    };
  }, [tenantSlug]);

  const initializeTenantFirebase = async (firebaseConfig) => {
    try {
      // Check if app already exists
      const existingApps = getApps();
      const existingApp = existingApps.find(app => app.name === `tenant_${tenantSlug}`);

      if (existingApp) {
        setTenantFirebaseApp(existingApp);
        setTenantAuth(getAuth(existingApp));
        return;
      }

      // Initialize new Firebase app for tenant
      const app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId
      }, `tenant_${tenantSlug}`);

      const auth = getAuth(app);
      setTenantFirebaseApp(app);
      setTenantAuth(auth);

      console.log('Tenant Firebase initialized:', tenantSlug);
    } catch (err) {
      console.error('Error initializing tenant Firebase:', err);
      throw err;
    }
  };

  // Helper to make API calls with tenant header
  const fetchWithTenant = async (url, options = {}) => {
    const headers = {
      ...options.headers,
    };

    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Check if a feature is enabled
  const hasFeature = (featureName) => {
    if (!tenantConfig || !tenantConfig.features) {
      return true; // Default to enabled if no config
    }
    return tenantConfig.features[featureName] === true;
  };

  // Get branding
  const getBranding = () => {
    return tenantConfig?.branding || {};
  };

  // Get Razorpay key
  const getRazorpayKey = () => {
    return tenantConfig?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  };

  const value = {
    tenantSlug,
    tenantConfig,
    tenantFirebaseApp,
    tenantAuth,
    loading,
    error,
    fetchWithTenant,
    hasFeature,
    getBranding,
    getRazorpayKey,
    isTenantMode: !!tenantSlug
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;
