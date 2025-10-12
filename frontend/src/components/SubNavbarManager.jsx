import React, { useState, useEffect } from 'react';
import { useSubNavbar } from '../context/SubNavbarContext';
import { useSettings } from '../context/SettingsContext';

const SubNavbarManager = ({ onMessage }) => {
  const { subNavbarData, updateBannerText, updateSocialLink } = useSubNavbar();
  const { settings, getSettingValue, refetch } = useSettings();
  
  const [editData, setEditData] = useState({
    bannerText: '',
    telegramUrl: '',
    whatsappUrl: ''
  });
  
  const [loading, setLoading] = useState(false);

  // Get values from Google Sheets with fallback to database
  const showTopBanner = getSettingValue('Show Top Banner', false);
  const bannerMessage = getSettingValue('Banner Message', '');
  const telegramEnabled = getSettingValue('Telegram', false);
  const telegramUrl = settings['Telegram']?.link || '';
  const whatsappEnabled = getSettingValue('WhatsApp', false);
  const whatsappUrl = settings['WhatsApp']?.link || '';

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    // Update edit data with Google Sheets values when available
    if (settings && Object.keys(settings).length > 0) {
      setEditData({
        bannerText: bannerMessage || subNavbarData?.bannerText || '',
        telegramUrl: telegramUrl || subNavbarData?.socialLinks?.telegram?.url || '',
        whatsappUrl: whatsappUrl || subNavbarData?.socialLinks?.whatsapp?.url || ''
      });
    } else if (subNavbarData) {
      setEditData({
        bannerText: subNavbarData.bannerText || '',
        telegramUrl: subNavbarData.socialLinks?.telegram?.url || '',
        whatsappUrl: subNavbarData.socialLinks?.whatsapp?.url || ''
      });
    }
  }, [settings, subNavbarData, bannerMessage, telegramUrl, whatsappUrl]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        updateBannerText(editData.bannerText),
        updateSocialLink('telegram', editData.telegramUrl),
        updateSocialLink('whatsapp', editData.whatsappUrl)
      ]);

      const allSuccessful = results.every(result => result && result.success !== false);

      if (allSuccessful) {
        onMessage?.('subNavbar', 'SubNavbar updated successfully!');
      } else {
        const failedResults = results.filter(result => !result || result.success === false);
        console.error('Some updates failed:', failedResults);
        onMessage?.('subNavbar', 'Some updates failed. Please try again.');
      }
    } catch (error) {
      console.error('Error updating SubNavbar:', error);
      onMessage?.('subNavbar', 'Error updating SubNavbar');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="mb-2 sm:mb-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sub Navbar Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Configure the top banner and social media links</p>
          </div>
          <div className="flex items-center space-x-4 self-start sm:self-auto">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${showTopBanner ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-500">
                {showTopBanner ? 'Banner Enabled' : 'Banner Disabled'} (Google Sheets)
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

      <div className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Banner Text */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Banner Text</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                <div className={`w-2 h-2 rounded-full ${bannerMessage ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Message
                </label>
                <input
                  type="text"
                  value={editData.bannerText}
                  onChange={(e) => setEditData({ ...editData, bannerText: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                    bannerMessage ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter banner text..."
                  readOnly={!!bannerMessage}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Social Media Links</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Telegram */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Telegram</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Connect your Telegram channel</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <input
                      type="url"
                      value={editData.telegramUrl}
                      onChange={(e) => setEditData({ ...editData, telegramUrl: e.target.value })}
                      className={`w-full sm:w-auto px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                        telegramUrl ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                      placeholder="https://t.me/yourchannel"
                      readOnly={!!telegramUrl}
                    />
                    <button
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-default ${
                        telegramEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {telegramEnabled ? 'Enabled (Sheets)' : 'Disabled (Sheets)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">WhatsApp</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Connect your WhatsApp number</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <input
                      type="url"
                      value={editData.whatsappUrl}
                      onChange={(e) => setEditData({ ...editData, whatsappUrl: e.target.value })}
                      className={`w-full sm:w-auto px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                        whatsappUrl ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                      placeholder="https://wa.me/yournumber"
                      readOnly={!!whatsappUrl}
                    />
                    <button
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-default ${
                        whatsappEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {whatsappEnabled ? 'Enabled (Sheets)' : 'Disabled (Sheets)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-2">

              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh from Sheets
              </button>
              {(!bannerMessage || !telegramUrl || !whatsappUrl) && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center cursor-pointer px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Database
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubNavbarManager;