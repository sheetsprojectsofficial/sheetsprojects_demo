import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getApiUrl } from '../utils/api';

const SettingsContext = createContext();
const API_URL = getApiUrl();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const response = await apiFetch(`${API_URL}/settings`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
        setError(null);
      } else {
        console.error('Failed to fetch settings:', data.message);
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSettingValue = (key, defaultValue = '') => {
    const setting = settings[key];
    if (typeof setting === 'boolean') return setting;
    if (typeof setting === 'object' && setting?.value !== undefined) return setting.value;
    return setting || defaultValue;
  };

  const value = {
    settings,
    loading,
    error,
    getSettingValue,
    refetch: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};