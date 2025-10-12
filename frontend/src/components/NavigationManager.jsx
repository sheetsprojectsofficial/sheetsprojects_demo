import React, { useContext, useEffect } from 'react';
import { NavigationContext } from '../context/NavigationContext';
import { useSettings } from '../context/SettingsContext';

const NavigationManager = () => {
  const { navigationItems, toggleNavigationItem } = useContext(NavigationContext);
  const { settings, getSettingValue, refetch } = useSettings();

  // Get Google Sheets navigation values
  const menuOptions = getSettingValue('Menu options', 'Show');

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  // Create navigation items from Google Sheets data
  const createSheetsNavigationItems = () => {
    if (!settings || Object.keys(settings).length === 0) return [];
    
    const navigationItems = [];
    const keys = Object.keys(settings);
    
    // Find the positions of "Menu options" and "Our Work Section"
    const menuOptionsIndex = keys.findIndex(key => key === 'Menu options');
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');
    
    // If we can't find these markers, return empty array
    if (menuOptionsIndex === -1 || ourWorkSectionIndex === -1) {
      return navigationItems;
    }
    
    // Get only the keys between "Menu options" and "Our Work Section"
    const navigationKeys = keys.slice(menuOptionsIndex + 1, ourWorkSectionIndex);
    
    navigationKeys.forEach(key => {
      const setting = settings[key];
      
      
      // Include all navigation items and check the 'Show' column value
      if (typeof setting === 'object' && setting.hasOwnProperty('value')) {
        // The visibility is determined by the 'Show' column value (true/false or "Show"/"Hide")
        let isVisible = false;
        
        // Enhanced parsing logic for Google Sheets checkboxes
        if (typeof setting.value === 'boolean') {
          isVisible = setting.value;
        } else if (typeof setting.value === 'string') {
          // Check for various possible string values from Google Sheets checkboxes
          const value = setting.value.toLowerCase().trim();
          isVisible = value === 'show' || value === 'true' || value === '1' || value === 'yes' || value === 'on' || value === 'checked';
        } else if (setting.value === true || setting.value === 1) {
          isVisible = true;
        } else if (setting.value === 'TRUE' || setting.value === 'True') {
          // Handle uppercase boolean strings
          isVisible = true;
        }


        navigationItems.push({
          id: key.toLowerCase().replace(/\s+/g, ''),
          name: key,
          visible: isVisible,
          fromSheets: true
        });
      }
    });
    
    return navigationItems;
  };

  const sheetsNavigationItems = createSheetsNavigationItems();
  
  // Use Google Sheets data if available, otherwise fallback to context
  const displayNavigationItems = sheetsNavigationItems.length > 0 ? sheetsNavigationItems : navigationItems;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Navigation Management</h2>
            <p className="text-sm text-gray-600 mt-1">Control which menu items are visible to users</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${menuOptions ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-500">
                {menuOptions === 'Show' ? 'Menu Enabled' : 'Menu Disabled'} (Google Sheets)
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-brand-primary rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayNavigationItems.map((item) => (
            <div key={item.id} className={`flex flex-col p-4 rounded-lg border transition-all duration-200 ${
              item.fromSheets 
                ? 'border-green-300 bg-green-50 hover:border-green-400' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.visible ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  <label
                    htmlFor={`nav-${item.id}`}
                    className="text-sm font-medium cursor-pointer text-gray-700"
                  >
                    {item.name}
                    {item.fromSheets && (
                      <span className="text-green-600 text-xs ml-2">(Google Sheets)</span>
                    )}
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.fromSheets && (
                    <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Sheets</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.visible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id={`nav-${item.id}`}
                    checked={item.visible}
                    onChange={() => item.fromSheets ? null : toggleNavigationItem(item.id)}
                    className={`sr-only peer ${item.fromSheets ? 'cursor-not-allowed' : ''}`}
                    disabled={item.fromSheets}
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    item.fromSheets 
                      ? 'bg-green-200 peer-checked:bg-green-400 cursor-not-allowed' 
                      : 'bg-gray-200 peer-checked:bg-blue-600'
                  }`}></div>
                </label>
                {item.fromSheets && (
                  <span className="text-xs text-gray-500">Controlled by Sheets</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 text-sm text-gray-600">

              <div>

              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh from Sheets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationManager;