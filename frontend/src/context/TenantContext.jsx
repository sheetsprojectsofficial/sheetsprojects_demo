import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const TenantContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

// Check if Firebase env vars are configured
const hasFirebaseEnvConfig = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

// Get Firebase config from env vars (only fields actually used)
const getFirebaseEnvConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  };
};

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
      try {
        setLoading(true);
        setError(null);

        // PRIORITY 1: Check if Firebase env vars are configured (main website mode)
        if (hasFirebaseEnvConfig()) {
          console.log('[TenantContext] Using Firebase config from environment variables');
          const envConfig = getFirebaseEnvConfig();
          await initializeTenantFirebase(envConfig, 'env-config');
          setLoading(false);
          return;
        }

        // PRIORITY 2: Use tenant slug to fetch config from API
        if (!tenantSlug) {
          console.error('[TenantContext] No Firebase env vars and no tenant slug configured');
          setError('Authentication not configured. Set VITE_FIREBASE_* env vars or VITE_TENANT_SLUG.');
          setLoading(false);
          return;
        }

        console.log('[TenantContext] Fetching config for tenant:', tenantSlug);

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

        console.log('[TenantContext] Received tenant config:', data.config?.name);
        setTenantConfig(data.config);

        // Initialize Firebase for this tenant if config exists
        if (data.config.firebase && data.config.firebase.apiKey) {
          await initializeTenantFirebase(data.config.firebase, `tenant_${tenantSlug}`);
        } else {
          console.error('[TenantContext] No Firebase config found for tenant:', tenantSlug);
          setError('Firebase not configured for this tenant');
        }

      } catch (err) {
        console.error('[TenantContext] Error loading config:', err);
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

  const initializeTenantFirebase = async (firebaseConfig, appName = 'default') => {
    try {
      // Check if app already exists
      const existingApps = getApps();
      const existingApp = existingApps.find(app => app.name === appName || app.name === '[DEFAULT]');

      if (existingApp) {
        console.log('[TenantContext] Using existing Firebase app:', existingApp.name);
        setTenantFirebaseApp(existingApp);
        setTenantAuth(getAuth(existingApp));
        return;
      }

      console.log('[TenantContext] Initializing new Firebase app:', appName);

      // Initialize new Firebase app
      // Use default app name for env-config, named app for tenants
      const app = appName === 'env-config'
        ? initializeApp({
            apiKey: firebaseConfig.apiKey,
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket
          })
        : initializeApp({
            apiKey: firebaseConfig.apiKey,
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket
          }, appName);

      const auth = getAuth(app);
      setTenantFirebaseApp(app);
      setTenantAuth(auth);

      console.log('[TenantContext] Firebase initialized successfully:', appName);
    } catch (err) {
      console.error('[TenantContext] Error initializing Firebase:', err);
      setError('Failed to initialize authentication: ' + err.message);
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
  // STRICT: Only returns true if feature is explicitly enabled
  // Case-insensitive: checks both exact match and lowercase version
  const hasFeature = (featureName) => {
    // If in tenant mode but no config yet (loading), return false
    if (tenantSlug && !tenantConfig) {
      return false;
    }
    // If not in tenant mode, allow all features
    if (!tenantSlug) {
      return true;
    }
    // If tenant config exists, check features (case-insensitive)
    if (tenantConfig?.features) {
      // Try exact match first
      if (tenantConfig.features[featureName] === true) {
        return true;
      }
      // Try lowercase version (API returns lowercase keys)
      const lowerFeature = featureName.charAt(0).toLowerCase() + featureName.slice(1);
      if (tenantConfig.features[lowerFeature] === true) {
        return true;
      }
      // Try fully lowercase
      if (tenantConfig.features[featureName.toLowerCase()] === true) {
        return true;
      }
      return false;
    }
    // Default to false for tenant mode
    return false;
  };

  // Get all enabled features
  const getEnabledFeatures = () => {
    if (!tenantConfig?.features) return {};
    return tenantConfig.features;
  };

  // Get branding
  const getBranding = () => {
    return tenantConfig?.branding || {};
  };

  // Get Razorpay key
  const getRazorpayKey = () => {
    return tenantConfig?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  };

  // Check if a specific page is configured (has doc ID)
  // For non-tenant mode, all pages are considered configured
  const hasConfiguredPage = (pageName) => {
    // If not in tenant mode (main website), all pages are available
    if (!tenantSlug) {
      return true;
    }
    // If tenant config hasn't loaded yet, return false
    if (!tenantConfig) {
      return false;
    }
    // Check if the page is configured
    return tenantConfig.configuredPages?.[pageName] === true;
  };

  // Get all configured pages
  const getConfiguredPages = () => {
    if (!tenantSlug) {
      // Main website - all pages configured
      return {
        about: true,
        shippingPolicy: true,
        terms: true,
        cancellationsRefunds: true,
        privacy: true,
        refundPolicy: true,
        pricingPolicy: true
      };
    }
    return tenantConfig?.configuredPages || {};
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
    getEnabledFeatures,
    getBranding,
    getRazorpayKey,
    hasConfiguredPage,
    getConfiguredPages,
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
