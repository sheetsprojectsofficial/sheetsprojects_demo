import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const SalesPortfolio = () => {
  const { settings, getSettingValue } = useSettings();
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
    
    // Get all data from Google Sheets - same as PortfolioSectionManager
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
    <section className="py-10" style={{ backgroundColor: '#f6f7f9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          {portfolioData.title && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-brand-primary rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {portfolioData.title}
            </div>
          )}
          {portfolioData.heading && (
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {portfolioData.heading}
            </h2>
          )}
          {portfolioData.subheading && (
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {portfolioData.subheading}
            </p>
          )}
        </div>

        {/* Statistics Grid - Only show if stats exist */}
        {portfolioData.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {portfolioData.stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                      {stat.label}
                    </div>
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl text-2xl font-bold text-white shadow-lg mb-4 ${
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
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default SalesPortfolio; 