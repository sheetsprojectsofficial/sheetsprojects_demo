import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch, getApiUrl } from '../utils/api';

const NavigationContext = createContext();
const API_URL = getApiUrl();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [navigationItems, setNavigationItems] = useState([
    { id: 1, name: 'Home', href: '/', visible: true, active: true },
    { id: 2, name: 'Products', href: '/products', visible: true, active: false },
    { id: 3, name: 'Blog', href: '/blog', visible: true, active: false },
    { id: 4, name: 'Showcase', href: '/showcase', visible: true, active: false },
    { id: 5, name: 'Webinar', href: '/webinar', visible: false, active: false },
    { id: 6, name: 'Book', href: '/book', visible: true, active: false },
    { id: 7, name: 'Events', href: '/events', visible: false, active: false },
    { id: 8, name: 'Courses', href: '/courses', visible: true, active: false },
    { id: 9, name: 'Trainings', href: '/trainings', visible: false, active: false },
    { id: 10, name: 'Contact', href: '/contact', visible: true, active: false },
   ]);
  const [loading, setLoading] = useState(true);

  // Fetch navigation data from backend
  const fetchNavigation = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${API_URL}/navigation`);
      const data = await response.json();
      if (data.success) {
        setNavigationItems(data.navigation);
      }
    } catch (error) {
      console.error('Error fetching navigation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update navigation in backend
  const updateNavigationInBackend = async (updatedItems) => {
    try {
      const token = await user?.getIdToken();
      
      const response = await apiFetch(`${API_URL}/navigation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: updatedItems }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the navigation items from backend to ensure consistency
        await fetchNavigation();
      } else {
        console.error('Failed to update navigation in backend');
      }
    } catch (error) {
      console.error('Error updating navigation in backend:', error);
    }
  };

  // Toggle navigation item visibility
  const toggleNavigationItem = async (id) => {
    try {
      // Optimistically update the UI first
      const updatedItems = navigationItems.map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      
      setNavigationItems(updatedItems);

      // Update in backend if user is authenticated
      if (isAuthenticated() && user) {
        await updateNavigationInBackend(updatedItems);
      }
    } catch (error) {
      console.error('Error toggling navigation item:', error);
      // Revert the optimistic update on error
      await fetchNavigation();
    }
  };

  // Update navigation item
  const updateNavigationItem = async (id, updates) => {
    try {
      const updatedItems = navigationItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      
      setNavigationItems(updatedItems);

      // Update in backend if user is authenticated
      if (isAuthenticated() && user) {
        await updateNavigationInBackend(updatedItems);
      }
    } catch (error) {
      console.error('Error updating navigation item:', error);
      // Revert the optimistic update on error
      await fetchNavigation();
    }
  };

  // Fetch navigation data on component mount
  useEffect(() => {
    fetchNavigation();
  }, []);

  const value = {
    navigationItems,
    toggleNavigationItem,
    updateNavigationItem,
    fetchNavigation,
    loading,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export { NavigationContext }; 