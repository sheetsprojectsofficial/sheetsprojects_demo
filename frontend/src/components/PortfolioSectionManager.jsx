import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const PortfolioSectionManager = () => {
  const { settings, getSettingValue, refetch } = useSettings();
  
  const [portfolioData, setPortfolioData] = useState({
    title: '',
    heading: '',
    subheading: '',
    stats: []
  });

  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    // Get all data from Google Sheets - no hardcoded values
    const title = getSettingValue('Title', '');
    const heading = getSettingValue('Portfolio Main Heading', '');
    const subheading = getSettingValue('Portfolio Subheading', '');
    
    // Get statistics data from Google Sheets
    const stats = [];
    const statisticItems = ['Number of Projects', 'Number of Users', 'Projects Sold', 'Free Projects'];
    
    statisticItems.forEach(item => {
      const value = getSettingValue(item, '');
      const colorFromSheet = settings[item]?.link || ''; // Use link field for color
      
      if (value && value !== '') {
        stats.push({
          label: item,
          value: value,
          color: colorFromSheet.toLowerCase()
        });
      }
    });
    
    setPortfolioData({
      title,
      heading,
      subheading,
      stats
    });
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Our Work Section</h2>
            <p className="text-sm text-gray-600 mt-1">Portfolio section data from Google Sheets - edit your sheet to make changes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-500">Controlled by Google Sheets</span>
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
          {/* Live Preview */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-6">Live Preview</h4>
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-brand-primary rounded-full text-xs font-medium mb-4">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {portfolioData.title}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {portfolioData.heading}
              </h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">
                {portfolioData.subheading}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {portfolioData.stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      {stat.label}
                    </div>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold text-white shadow-md mb-2 ${
                      stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      stat.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                      stat.color === 'pink' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                      stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
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

export default PortfolioSectionManager;