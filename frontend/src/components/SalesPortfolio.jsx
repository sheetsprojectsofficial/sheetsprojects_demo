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

    const title = getSettingValue('Title', '');
    const heading = getSettingValue('Portfolio Main Heading', '');
    const subheading = getSettingValue('Portfolio Subheading', '');

    const stats = [];
    const keys = Object.keys(settings);

    // Find the Our Work Section boundaries
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');
    const productsSectionIndex = keys.findIndex(key => key === 'Products Section' || key === 'Products section');

    // Keys that are part of the section header, not stats
    const excludeKeys = [
      'Our Work Section', 'Statistics', 'Statistic', 'Title',
      'Portfolio Main Heading', 'Portfolio Subheading',
      'Products Section', 'Products section',
      'Label', 'Value', 'Field', 'color'
    ];

    if (ourWorkSectionIndex !== -1) {
      // Get keys between Our Work Section and Products Section (or end if not found)
      const endIndex = productsSectionIndex !== -1 ? productsSectionIndex : keys.length;
      const sectionKeys = keys.slice(ourWorkSectionIndex, endIndex);

      sectionKeys.forEach(key => {
        // Skip header/title keys
        if (excludeKeys.includes(key)) return;

        const setting = settings[key];
        const value = typeof setting === 'object' ? setting?.value : setting;
        // Try different property names for color (link, color, extra, etc.)
        const colorFromSheet = setting?.link || setting?.color || setting?.extra || '';



        // Only add if it has a value and looks like a stat (has numeric content)
        if (value && value !== '' && value !== 'TRUE' && value !== 'FALSE' && value !== true && value !== false) {
          stats.push({
            label: key,
            value: value,
            color: colorFromSheet ? colorFromSheet.toLowerCase() : ''
          });
        }
      });
    }

    setPortfolioData({
      title,
      heading,
      subheading,
      stats
    });
  };

  // Get color classes based on color name from settings
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        hover: 'rgba(59, 130, 246, 0.05)'
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-500',
        hover: 'rgba(34, 197, 94, 0.05)'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-500',
        hover: 'rgba(168, 85, 247, 0.05)'
      },
      orange: {
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        hover: 'rgba(249, 115, 22, 0.05)'
      },
      red: {
        bg: 'bg-red-500',
        text: 'text-red-500',
        hover: 'rgba(239, 68, 68, 0.05)'
      },
      yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600',
        hover: 'rgba(234, 179, 8, 0.05)'
      },
      pink: {
        bg: 'bg-pink-500',
        text: 'text-pink-500',
        hover: 'rgba(236, 72, 153, 0.05)'
      },
      indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-500',
        hover: 'rgba(99, 102, 241, 0.05)'
      },
      teal: {
        bg: 'bg-teal-500',
        text: 'text-teal-500',
        hover: 'rgba(20, 184, 166, 0.05)'
      },
      cyan: {
        bg: 'bg-cyan-500',
        text: 'text-cyan-500',
        hover: 'rgba(6, 182, 212, 0.05)'
      }
    };

    return colorMap[color?.toLowerCase()] || {
      bg: 'bg-brand-primary',
      text: 'text-brand-primary',
      hover: 'rgba(var(--brand-primary-rgb), 0.05)'
    };
  };

  const getStatIcon = (label) => {
    // Dynamic icon selection based on keywords in the label
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('project')) {
      return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
    }
    if (lowerLabel.includes('user') || lowerLabel.includes('client') || lowerLabel.includes('customer')) {
      return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
    }
    if (lowerLabel.includes('sold') || lowerLabel.includes('sale') || lowerLabel.includes('order')) {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    if (lowerLabel.includes('merchant') || lowerLabel.includes('partner') || lowerLabel.includes('vendor')) {
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    }
    if (lowerLabel.includes('happy') || lowerLabel.includes('satisfied') || lowerLabel.includes('review')) {
      return 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    if (lowerLabel.includes('free') || lowerLabel.includes('gift')) {
      return 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7';
    }
    if (lowerLabel.includes('year') || lowerLabel.includes('experience')) {
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    if (lowerLabel.includes('country') || lowerLabel.includes('location') || lowerLabel.includes('global')) {
      return 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    // Default icon
    return 'M13 10V3L4 14h7v7l9-11h-7z';
  };

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 lg:mb-20">
          {portfolioData.title && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
              <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{portfolioData.title}</span>
            </div>
          )}

          {portfolioData.heading && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight max-w-4xl mx-auto">
              {portfolioData.heading}
            </h2>
          )}

          {portfolioData.subheading && (
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {portfolioData.subheading}
            </p>
          )}
        </div>

        {/* Statistics Grid */}
        {portfolioData.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {portfolioData.stats.map((stat, index) => {
              const colorClasses = getColorClasses(stat.color);
              return (
                <div key={index} className="group relative">
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden group-hover:-translate-y-1">
                    {/* Background on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: colorClasses.hover }}></div>

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center mb-6 shadow-lg`}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getStatIcon(stat.label)} />
                        </svg>
                      </div>

                      {/* Value */}
                      <div className="mb-2">
                        <span className={`text-4xl lg:text-5xl font-bold ${colorClasses.text}`}>
                          {stat.value}
                        </span>
                      </div>

                      {/* Label */}
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Text */}
        {portfolioData.stats.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              Trusted by businesses worldwide for innovative spreadsheet solutions
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SalesPortfolio;
