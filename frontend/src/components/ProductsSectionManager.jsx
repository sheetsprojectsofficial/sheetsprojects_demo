import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const ProductsSectionManager = ({ onMessage }) => {
  const { user } = useAuth();
  const { settings, getSettingValue, refetch } = useSettings();
  
  const [productsData, setProductsData] = useState({
    heading: '',
    headingHighlight: '',
    subheading: '',
    sectionEnabled: false
  });

  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    // Get products header data from Google Sheets using the exact field names
    const heading = getSettingValue('Products Main Heading', '');
    const headingHighlight = getSettingValue('Products Highlighted Text', '');
    const subheading = getSettingValue('Products Subheading', '');
    const sectionEnabled = getSettingValue('Products Section Enabled', false);
    
    setProductsData({
      heading,
      headingHighlight,
      subheading,
      sectionEnabled
    });
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Products Section</h2>
            <p className="text-sm text-gray-600 mt-1">Products section header data from Google Sheets - edit your sheet to make changes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${productsData.sectionEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-500">
                {productsData.sectionEnabled ? 'Section Enabled' : 'Section Disabled'} (Google Sheets)
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
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Section Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Heading
                </label>
                <input
                  type="text"
                  name="heading"
                  value={productsData.heading}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlighted Text
                </label>
                <input
                  type="text"
                  name="headingHighlight"
                  value={productsData.headingHighlight}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subheading
              </label>
              <textarea
                name="subheading"
                value={productsData.subheading}
                readOnly
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                placeholder="Controlled by Google Sheets"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              onClick={() => refetch()}
              className="inline-flex cursor-pointer items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh from Google Sheets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsSectionManager;