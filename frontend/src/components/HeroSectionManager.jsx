import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useSettings } from '../context/SettingsContext';
import { convertGoogleDriveUrl, getGoogleDrivePreviewUrl } from '../utils/imageUtils';
import { apiFetch } from '../utils/api';

const HeroSectionManager = ({ onMessage }) => {
  const { user } = useAuth();
  const { refreshBrandName } = useBrand();
  const { settings, getSettingValue, refetch } = useSettings();
  
  const [heroData, setHeroData] = useState({
    brandName: '',
    heroText: '',
    heroDescription: '',
    buttonName: '',
    imageUrl: '',
    imagePublicId: '',
    googleAnalyticsScript: ''
  });
  
  const [loading, setLoading] = useState(false);

  // Get values from Google Sheets with fallback to database
  const heroSectionEnabled = getSettingValue('Hero Section Enabled', true);
  const sheetsBrandName = getSettingValue('Brand Name', '') || getSettingValue('Brand name', '');
  const sheetsHeroText = getSettingValue('Hero Text', '');
  const sheetsHeroDescription = getSettingValue('Hero Description', '');
  const sheetsButtonName = getSettingValue('Button Name', '');
  const sheetsButtonLink = getSettingValue('Button Link', '');
  const sheetsHeroImageUrl = getSettingValue('Hero Image URL', '');

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    fetchHeroData();
  }, []);

  useEffect(() => {
    // Update hero data with Google Sheets values when available
    if (settings && Object.keys(settings).length > 0) {
      setHeroData(prev => ({
        ...prev,
        brandName: sheetsBrandName || prev.brandName,
        heroText: sheetsHeroText || prev.heroText,
        heroDescription: sheetsHeroDescription || prev.heroDescription,
        buttonName: sheetsButtonName || prev.buttonName,
        imageUrl: sheetsHeroImageUrl || prev.imageUrl
      }));
    }
  }, [settings, sheetsBrandName, sheetsHeroText, sheetsHeroDescription, sheetsButtonName, sheetsHeroImageUrl]);

  const fetchHeroData = async () => {
    try {
      const heroResponse = await apiFetch('/hero');
      const heroResult = await heroResponse.json();

      if (heroResult.success) {
        const dbData = {
          brandName: heroResult.heroSection?.brandName || '',
          heroText: heroResult.heroSection?.heroText || '',
          heroDescription: heroResult.heroSection?.heroDescription || '',
          buttonName: heroResult.heroSection?.buttonName || '',
          imageUrl: heroResult.heroSection?.imageUrl || '',
          imagePublicId: heroResult.heroSection?.imagePublicId || '',
          googleAnalyticsScript: heroResult.heroSection?.googleAnalyticsScript || ''
        };

        // Merge with Google Sheets data
        setHeroData({
          brandName: sheetsBrandName || dbData.brandName,
          heroText: sheetsHeroText || dbData.heroText,
          heroDescription: sheetsHeroDescription || dbData.heroDescription,
          buttonName: sheetsButtonName || dbData.buttonName,
          imageUrl: sheetsHeroImageUrl || dbData.imageUrl,
          imagePublicId: dbData.imagePublicId,
          googleAnalyticsScript: dbData.googleAnalyticsScript
        });
      }
    } catch (error) {
      console.error('Error fetching hero data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHeroData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = await user.getIdToken();
      const response = await apiFetch('/hero', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(heroData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        onMessage?.('hero', 'Hero section updated successfully!');
        refreshBrandName();
      } else {
        onMessage?.('hero', 'Failed to update hero section');
      }
    } catch (error) {
      console.error('Error updating hero:', error);
      onMessage?.('hero', 'Error updating hero section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hero Section</h2>
            <p className="text-sm text-gray-600 mt-1">Customize your website's main banner and call-to-action</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${heroSectionEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-500">
                {heroSectionEnabled ? 'Section Enabled' : 'Section Disabled'} (Google Sheets)
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand Name
                  {sheetsBrandName && (
                    <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                  )}
                </label>
                {sheetsBrandName && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                name="brandName"
                value={heroData.brandName || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                  sheetsBrandName ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="Enter your brand name..."
                readOnly={!!sheetsBrandName}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hero Text
                  {sheetsHeroText && (
                    <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                  )}
                </label>
                {sheetsHeroText && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                name="heroText"
                value={heroData.heroText || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                  sheetsHeroText ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="Enter your main headline..."
                readOnly={!!sheetsHeroText}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Hero Description
                {sheetsHeroDescription && (
                  <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                )}
              </label>
              {sheetsHeroDescription && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              )}
            </div>
            <textarea
              name="heroDescription"
              value={heroData.heroDescription || ''}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                sheetsHeroDescription ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
              placeholder="Describe your main value proposition..."
              readOnly={!!sheetsHeroDescription}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Button Name
                  {sheetsButtonName && (
                    <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                  )}
                </label>
                {sheetsButtonName && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                name="buttonName"
                value={heroData.buttonName || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                  sheetsButtonName ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="Enter button text..."
                readOnly={!!sheetsButtonName}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Button Link
                  {sheetsButtonLink && (
                    <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                  )}
                </label>
                {sheetsButtonLink && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={sheetsButtonLink || ''}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                  sheetsButtonLink ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="Button link (e.g., /contact, https://...)"
                readOnly={!!sheetsButtonLink}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Hero Image URL
                {sheetsHeroImageUrl && (
                  <span className="text-green-600 text-xs ml-2">(From Google Sheets)</span>
                )}
              </label>
              {sheetsHeroImageUrl && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-brand-primary bg-blue-100 px-2 py-1 rounded">Google Sheets</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              )}
            </div>
            <input
              type="url"
              value={sheetsHeroImageUrl || heroData.imageUrl || ''}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors ${
                sheetsHeroImageUrl ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
              placeholder="Hero image URL from Google Sheets..."
              readOnly={!!sheetsHeroImageUrl}
            />
            {sheetsHeroImageUrl && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="space-y-2">
                  <img 
                    src={getGoogleDrivePreviewUrl(sheetsHeroImageUrl)} 
                    alt="Hero preview" 
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onLoad={() => {
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />

                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-2">

              </div>

            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh from Sheets
              </button>
              {(!sheetsBrandName || !sheetsHeroText || !sheetsHeroDescription || !sheetsButtonName) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </form>
      </div>
    </div>
  );
};

export default HeroSectionManager;