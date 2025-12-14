import React, { createContext, useContext } from 'react';
import { useSettings } from './SettingsContext';
import { useBrand } from './BrandContext';
import { useNavigation } from './NavigationContext';
import { useSubNavbar } from './SubNavbarContext';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const { loading: settingsLoading } = useSettings();
  const { loading: brandLoading } = useBrand();
  const { loading: navigationLoading } = useNavigation();
  const { loading: subNavbarLoading } = useSubNavbar();

  // Combined loading state - wait for all critical data
  const isLoading = settingsLoading || brandLoading || navigationLoading || subNavbarLoading;

  const value = {
    isLoading
  };

  // Show loading screen until all contexts are loaded
  if (isLoading) {
    return (
      <LoadingContext.Provider value={value}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading...</p>
          </div>
        </div>
      </LoadingContext.Provider>
    );
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};
