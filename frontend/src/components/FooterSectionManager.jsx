import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const FooterSectionManager = () => {
  const { settings, getSettingValue, refetch } = useSettings();
  
  // Helper function to get URL values from the 'link' property
  const getURLValue = (key, defaultValue = '') => {
    const setting = settings[key];
    if (typeof setting === 'object' && setting?.link !== undefined) {
      return setting.link;
    }
    return defaultValue;
  };
  
  const [footerData, setFooterData] = useState({
    // Company Information
    companyName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    
    // Quick Links Main Control
    quickLinkEnabled: false,
    termsLinkEnabled: false,
    
    // Navigation Items (from NavigationManager)
    homeEnabled: false,
    productsEnabled: false,
    
    // Quick Links Items
    contactUsEnabled: false,
    termConditionEnabled: false,
    privacyPolicyEnabled: false,
    
    // URLs for footer links
    homeURL: '/',
    productsURL: '/products',
    contactUsURL: '/contact',
    termConditionURL: '/terms',
    privacyPolicyURL: '/privacy',
    
    // Social Media
    socialMediaEnabled: false,
    facebookEnabled: false,
    twitterEnabled: false,
    instagramEnabled: false,
    linkedinEnabled: false,
    youtubeEnabled: false,
    facebookURL: '',
    twitterURL: '',
    instagramURL: '',
    linkedinURL: '',
    youtubeURL: '',
    
    // Copyright
    copyrightText: ''
  });
  
  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    // Get footer data from Google Sheets using the exact field names
    const companyName = getSettingValue('Company Name', '');
    const email = getSettingValue('Email', '');
    const phone = getSettingValue('Phone', '');
    const address = getSettingValue('Address', '');
    const description = getSettingValue('Description', '');
    
    // Main Quick Links and Terms control
    const quickLinkEnabled = getSettingValue('Quick Link Enabled', false);
    const termsLinkEnabled = getSettingValue('Terms Link Enabled', false);
    
    // Navigation items from NavigationManager (these should be visible if enabled in navigation)
    const homeEnabled = getSettingValue('Home', false);
    const productsEnabled = getSettingValue('Products', false);
    
    // Quick Links Items
    const contactUsEnabled = getSettingValue('Contact Us', false);
    const termConditionEnabled = getSettingValue('Term & Condition', false);
    const privacyPolicyEnabled = getSettingValue('Privacy Policy', false);
    
    // Get URLs for footer links using the link property
    const homeURL = getURLValue('Home URL', '/');
    const productsURL = getURLValue('Products URL', '/products');
    const contactUsURL = getURLValue('Contact Us URL', '/contact');
    const termConditionURL = getURLValue('Term & Condition URL', '/terms');
    const privacyPolicyURL = getURLValue('Privacy Policy URL', '/privacy');
    
    // Social Media
    const socialMediaEnabled = getSettingValue('Social Media Enabled', false);
    
    // Get both enabled status and URL values for each social media platform
    const facebookEnabled = getSettingValue('Facebook URL', false); // Checkbox status
    const twitterEnabled = getSettingValue('Twitter URL', false);
    const instagramEnabled = getSettingValue('Instagram URL', false);
    const linkedinEnabled = getSettingValue('LinkedIn URL', false);
    const youtubeEnabled = getSettingValue('YouTube URL', false);
    
    // Get the actual URL values from the 'link' property
    const facebookURL = getURLValue('Facebook URL', '');
    const twitterURL = getURLValue('Twitter URL', '');
    const instagramURL = getURLValue('Instagram URL', '');
    const linkedinURL = getURLValue('LinkedIn URL', '');
    const youtubeURL = getURLValue('YouTube URL', '');
    
    // Copyright
    const copyrightText = getSettingValue('Copyright Text', '');
    
    setFooterData({
      companyName,
      email,
      phone,
      address,
      description,
      quickLinkEnabled,
      termsLinkEnabled,
      homeEnabled,
      productsEnabled,
      contactUsEnabled,
      termConditionEnabled,
      privacyPolicyEnabled,
      homeURL,
      productsURL,
      contactUsURL,
      termConditionURL,
      privacyPolicyURL,
      socialMediaEnabled,
      facebookEnabled,
      twitterEnabled,
      instagramEnabled,
      linkedinEnabled,
      youtubeEnabled,
      facebookURL,
      twitterURL,
      instagramURL,
      linkedinURL,
      youtubeURL,
      copyrightText
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Footer Section</h2>
            <p className="text-sm text-gray-600 mt-1">Footer section data from Google Sheets - edit your sheet to make changes</p>
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
          {/* Company Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={footerData.companyName}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={footerData.email}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={footerData.phone}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={footerData.address}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                  placeholder="Controlled by Google Sheets"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={footerData.description}
                readOnly
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-colors"
                placeholder="Controlled by Google Sheets"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            
            {/* Main Quick Links Control */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${footerData.quickLinkEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-900">Quick Link Section</span>
                <span className="text-xs text-gray-600">
                  ({footerData.quickLinkEnabled ? 'Enabled - Quick links will show in footer' : 'Disabled - Quick links will NOT show in footer'})
                </span>
              </div>
            </div>
            
            {/* Quick Links Items - Home, Products, Contact Us */}
            <div className="space-y-4">
              {/* Home */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.homeEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Home</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.homeEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.homeURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* Products */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.productsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Products</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.productsEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.productsURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* Contact Us */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.contactUsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Contact Us</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.contactUsEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.contactUsURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Terms Section</h3>
            
            {/* Main Terms Control */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${footerData.termsLinkEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-900">Terms Section</span>
                <span className="text-xs text-gray-600">
                  ({footerData.termsLinkEnabled ? 'Enabled - Terms section will show in footer' : 'Disabled - Terms section will NOT show in footer'})
                </span>
              </div>
            </div>
            
            {/* Terms Links Items - Terms & Conditions, Privacy Policy */}
            <div className="space-y-4">
              {/* Terms & Conditions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.termConditionEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Terms & Conditions</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.termConditionEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.termConditionURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* Privacy Policy */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.privacyPolicyEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Privacy Policy</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.privacyPolicyEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.privacyPolicyURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
            <div className="mb-4 flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${footerData.socialMediaEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700">Social Media Section</span>
              <span className="text-xs text-gray-500">
                ({footerData.socialMediaEnabled ? 'Enabled' : 'Disabled'})
              </span>
            </div>
            <div className="space-y-4">
              {/* Facebook */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.facebookEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.facebookEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.facebookURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* Twitter */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.twitterEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Twitter</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.twitterEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.twitterURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* Instagram */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.instagramEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Instagram</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.instagramEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.instagramURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* LinkedIn */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.linkedinEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.linkedinEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.linkedinURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
              
              {/* YouTube */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded ${footerData.youtubeEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">YouTube</span>
                  <span className="text-xs text-gray-500">
                    ({footerData.youtubeEnabled ? 'Enabled' : 'Disabled'})
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={footerData.youtubeURL}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Controlled by Google Sheets"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Copyright</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
              <input
                type="text"
                value={footerData.copyrightText}
                readOnly
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

export default FooterSectionManager;