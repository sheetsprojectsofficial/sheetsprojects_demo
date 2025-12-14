import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const FooterSectionManager = () => {
  const { settings, getSettingValue, refetch } = useSettings();

  // Menu options mapping - same as FooterContext
  const menuOptionsMapping = [
    { name: 'Products', href: '/products', settingKey: 'Products' },
    { name: 'Blog', href: '/blog', settingKey: 'Blog' },
    { name: 'Showcase', href: '/showcase', settingKey: 'Showcase' },
    { name: 'Book', href: '/book', settingKey: 'Books' },
    { name: 'Courses', href: '/courses', settingKey: 'Courses' },
    { name: 'Bookings', href: '/bookings', settingKey: 'Bookings' },
    { name: 'Invoices', href: '/invoices', settingKey: 'Invoices' },
    { name: 'Portfolio', href: '/portfolio', settingKey: 'Portfolio' },
    { name: 'Webinar', href: '/webinar', settingKey: 'Webinar' },
    { name: 'Events', href: '/events', settingKey: 'Events' },
    { name: 'Trainings', href: '/trainings', settingKey: 'Trainings' },
  ];

  // Terms/Policy pages - hardcoded as they always show in footer
  const termsPages = [
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Cancellations & Refunds', href: '/cancellations-refunds' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund-policy' },
    { name: 'Pricing Policy', href: '/pricing-policy' },
  ];

  const [footerData, setFooterData] = useState({
    description: '',
    quickLinks: [],
    socialMediaEnabled: false,
    facebookURL: '',
    twitterURL: '',
    instagramURL: '',
    linkedinURL: '',
    youtubeURL: '',
    copyrightText: ''
  });

  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;

    const description = getSettingValue('Description', '');

    // Build quick links based on settings
    const quickLinks = menuOptionsMapping.map(menuOption => {
      const isEnabled = getSettingValue(menuOption.settingKey, false);
      return {
        name: menuOption.name,
        href: menuOption.href,
        settingKey: menuOption.settingKey,
        enabled: isEnabled === true || isEnabled === 'TRUE' || isEnabled === 'true'
      };
    });

    // Social Media
    const socialMediaEnabled = getSettingValue('Social Media Enabled', false);
    const facebookURL = getSettingValue('Facebook URL', '');
    const twitterURL = getSettingValue('Twitter URL', '');
    const instagramURL = getSettingValue('Instagram URL', '');
    const linkedinURL = getSettingValue('LinkedIn URL', '');
    const youtubeURL = getSettingValue('YouTube URL', '');

    // Copyright
    const copyrightText = getSettingValue('Copyright Text', '');

    setFooterData({
      description,
      quickLinks,
      socialMediaEnabled: socialMediaEnabled === true || socialMediaEnabled === 'TRUE' || socialMediaEnabled === 'true',
      facebookURL: typeof facebookURL === 'object' ? facebookURL.link || '' : facebookURL || '',
      twitterURL: typeof twitterURL === 'object' ? twitterURL.link || '' : twitterURL || '',
      instagramURL: typeof instagramURL === 'object' ? instagramURL.link || '' : instagramURL || '',
      linkedinURL: typeof linkedinURL === 'object' ? linkedinURL.link || '' : linkedinURL || '',
      youtubeURL: typeof youtubeURL === 'object' ? youtubeURL.link || '' : youtubeURL || '',
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
            <div>
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
            <p className="text-sm text-gray-500 mb-4">
              These links are controlled by the Menu Options in your Google Sheets. Only checked items will appear in the footer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {footerData.quickLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${link.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">{link.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{link.href}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${link.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {link.enabled ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              ))}

              {/* About Us - Always shown */}
              <div className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">About Us</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">/about</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    Always Visible
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Terms Section</h3>
            <p className="text-sm text-gray-500 mb-4">
              These policy pages are always shown in the footer Terms section.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {termsPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">{page.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{page.href}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
            <div className="mb-4 flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${footerData.socialMediaEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700">Social Media Section</span>
              <span className={`text-xs px-2 py-0.5 rounded ${footerData.socialMediaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {footerData.socialMediaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Facebook */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${footerData.facebookURL ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </div>
                <input
                  type="text"
                  value={footerData.facebookURL || 'Not set'}
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* Twitter */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${footerData.twitterURL ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Twitter</span>
                </div>
                <input
                  type="text"
                  value={footerData.twitterURL || 'Not set'}
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* Instagram */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${footerData.instagramURL ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">Instagram</span>
                </div>
                <input
                  type="text"
                  value={footerData.instagramURL || 'Not set'}
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* LinkedIn */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${footerData.linkedinURL ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                </div>
                <input
                  type="text"
                  value={footerData.linkedinURL || 'Not set'}
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* YouTube */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${footerData.youtubeURL ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-700">YouTube</span>
                </div>
                <input
                  type="text"
                  value={footerData.youtubeURL || 'Not set'}
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 cursor-not-allowed text-gray-500"
                />
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
