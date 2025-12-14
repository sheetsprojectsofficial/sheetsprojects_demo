import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubNavbarContext = createContext();

export const useSubNavbar = () => {
  const context = useContext(SubNavbarContext);
  if (!context) {
    throw new Error('useSubNavbar must be used within a SubNavbarProvider');
  }
  return context;
};

export const SubNavbarProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subNavbarData, setSubNavbarData] = useState({
    bannerText: "Need help with any google sheets projects? 🚀",
    socialLinks: {
      telegram: {
        enabled: true,
        url: "https://t.me/yourchannel"
      },
      whatsapp: {
        enabled: true,
        url: "https://wa.me/yournumber"
      }
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch subnavbar data from backend
  const fetchSubNavbar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subnavbar`);
      const data = await response.json();
      if (data.success) {
        setSubNavbarData(data.subNavbar);
      }
    } catch (error) {
      console.error('Error fetching subnavbar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update subnavbar in backend
  const updateSubNavbarInBackend = async (updatedData) => {
    try {
      const token = await user?.getIdToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subnavbar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, data: data.subNavbar };
      } else {
        console.error('Failed to update subnavbar in backend:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error updating subnavbar in backend:', error);
      return { success: false, message: error.message };
    }
  };

  // Update banner text
  const updateBannerText = async (newText) => {
    const updatedData = { ...subNavbarData, bannerText: newText };
    setSubNavbarData(updatedData);

    if (isAuthenticated() && user) {
      const result = await updateSubNavbarInBackend(updatedData);
      if (result.success && result.data) {
        setSubNavbarData(result.data);
      }
      return result;
    }
    return { success: true };
  };

  // Update social link
  const updateSocialLink = async (platform, updates) => {
    const updatedData = {
      ...subNavbarData,
      socialLinks: {
        ...subNavbarData.socialLinks,
        [platform]: {
          ...subNavbarData.socialLinks[platform],
          ...updates
        }
      }
    };
    
    setSubNavbarData(updatedData);

    if (isAuthenticated() && user) {
      const result = await updateSubNavbarInBackend(updatedData);
      if (result.success && result.data) {
        setSubNavbarData(result.data);
      }
      return result;
    }
    return { success: true };
  };

  // Fetch subnavbar data on component mount
  useEffect(() => {
    fetchSubNavbar();
  }, []);

  const value = {
    subNavbarData,
    updateBannerText,
    updateSocialLink,
    fetchSubNavbar,
    loading,
  };

  return (
    <SubNavbarContext.Provider value={value}>
      {children}
    </SubNavbarContext.Provider>
  );
};

export { SubNavbarContext }; 