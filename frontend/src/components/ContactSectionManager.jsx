import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const ContactSectionManager = ({ onMessage }) => {
  const { user } = useAuth();
  const { settings, getSettingValue, refetch } = useSettings();
  
  const [contactData, setContactData] = useState({
    heading: '',
    subheading: '',
    email: '',
    phone: '',
    weekdaysHours: '',
    weekendHours: '',
    supportTitle: '',
    supportDescription: '',
    responseTime: ''
  });
  
  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    // Get contact data from Google Sheets using the exact field names
    const heading = getSettingValue('Contact Main Heading', '');
    const subheading = getSettingValue('Contact Subheading', '');
    const email = getSettingValue('Email Address', '');
    const phone = getSettingValue('Phone Number', '');
    const weekdaysHours = getSettingValue('Weekdays Hours', '');
    const weekendHours = getSettingValue('Weekend Hours', '');
    const supportTitle = getSettingValue('Support Title', '');
    const supportDescription = getSettingValue('Support Description', '');
    const responseTime = getSettingValue('Response Time', '');
    
    setContactData({
      heading,
      subheading,
      email,
      phone,
      weekdaysHours,
      weekendHours,
      supportTitle,
      supportDescription,
      responseTime
    });
    

  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="mb-2 sm:mb-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Contact Us Section</h2>
            <p className="text-sm text-gray-600 mt-1">Contact section data from Google Sheets - edit your sheet to make changes</p>
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
      
      <div className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Section Header */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Section Header</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Main Heading
                </label>
                <input
                  type="text"
                  value={contactData.heading}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Subheading
                </label>
                <textarea
                  value={contactData.subheading}
                  readOnly
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactData.email}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactData.phone}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Business Hours</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekdays Hours
                </label>
                <input
                  type="text"
                  value={contactData.weekdaysHours}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekend Hours
                </label>
                <input
                  type="text"
                  value={contactData.weekendHours}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Support Information</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Title
                </label>
                <input
                  type="text"
                  value={contactData.supportTitle}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Description
                </label>
                <textarea
                  value={contactData.supportDescription}
                  readOnly
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Time
                </label>
                <input
                  type="text"
                  value={contactData.responseTime}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
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

export default ContactSectionManager;