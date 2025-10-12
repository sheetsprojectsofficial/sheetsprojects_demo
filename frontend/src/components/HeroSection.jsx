import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';
import { optimizeImageUrl } from '../utils/imageUtils';

const HeroSection = () => {
  const { brandName } = useBrand();
  const { getSettingValue } = useSettings();
  const { getThemeClasses } = useTheme();
  const navigate = useNavigate();
  
  const themeClasses = getThemeClasses();
  
  // Get Google Sheets values
  const heroSectionEnabled = getSettingValue('Hero Section Enabled', true);
  const sheetsBrandName = getSettingValue('Brand Name', '') || getSettingValue('Brand name', '');
  const sheetsHeroText = getSettingValue('Hero Text', '');
  const sheetsHeroDescription = getSettingValue('Hero Description', '');
  const sheetsButtonName = getSettingValue('Button Name', '');
  const sheetsButtonLink = getSettingValue('Button Link', '');
  const sheetsHeroImageUrl = getSettingValue('Hero Image URL', '');

  // Don't render hero section if disabled in Google Sheets
  if (!heroSectionEnabled) {
    return null;
  }

  const handleCTAClick = () => {
    const buttonLink = sheetsButtonLink;
    if (buttonLink) {
      if (buttonLink.startsWith('http')) {
        window.open(buttonLink, '_blank', 'noopener,noreferrer');
      } else {
        navigate(buttonLink);
      }
    } else {
      navigate('/products');
    }
  };

  return (
    <section className="bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob" 
             style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.3)' }}></div>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000" 
             style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.2)' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" 
             style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium" 
                   style={{ backgroundColor: `rgba(var(--brand-primary-rgb), 0.1)`, color: 'var(--brand-primary)' }}>
                <span className="mr-2">🚀</span>
                {sheetsBrandName || brandName || 'Brand Name'}
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                <span className="bg-clip-text text-transparent" 
                      style={{ backgroundImage: `linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 70%, black))` }}>
                  {sheetsHeroText || 'All in One Solution'}
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                {sheetsHeroDescription || 'Your one-stop solution for Google Sheets projects and automation.'}
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className={`${themeClasses.primaryButton} cursor-pointer px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                onClick={handleCTAClick}
              >
                {sheetsButtonName || 'Get Started'}
              </button>
              <button 
                className="border-2 cursor-pointer border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1"
                style={{ 
                  '--hover-border': 'var(--brand-primary)', 
                  '--hover-text': 'var(--brand-primary)' 
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'var(--brand-primary)';
                  e.target.style.color = 'var(--brand-primary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.color = '#374151';
                }}
                onClick={() => navigate('/showcase')}
              >
                Learn More
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }}></div>
                <span className="text-sm text-gray-600">24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }}></div>
                <span className="text-sm text-gray-600">Expert Team</span>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative">
            {sheetsHeroImageUrl ? (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl hero-image-container">
                <img
                  src={optimizeImageUrl(sheetsHeroImageUrl, { width: 800, height: 600 })}
                  alt="Hero"
                  className="w-full h-96 object-cover rounded-3xl"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                  }}
                  onError={(e) => {
                    console.error('Hero image failed to load:', e.target.src);
                    // Hide the image container and show fallback
                    const container = e.target.closest('.hero-image-container');
                    if (container) {
                      container.style.display = 'none';
                    }
                    const fallbackDiv = document.querySelector('.hero-fallback');
                    if (fallbackDiv) {
                      fallbackDiv.style.display = 'block';
                    }
                  }}
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full opacity-60 animate-pulse animation-delay-1000"></div>
              </div>
            ) : null}
            
            {/* Fallback hero section - shows when image fails to load or no image provided */}
            <div className={`hero-fallback bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden ${sheetsHeroImageUrl ? 'hidden' : 'block'}`}>
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute top-8 left-8 w-16 h-16 bg-white opacity-10 rounded-full"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 opacity-20 rounded-full translate-x-12 translate-y-12"></div>
              
              {/* Services List */}
              <div className="relative z-10 space-y-6">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8">
                  Our Services
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    'APP SCRIPT DEVELOPMENT',
                    'SOCIAL MEDIA AUTOMATION', 
                    'WEBSITE DEVELOPMENT',
                    'WHATSAPP AUTOMATION',
                    'EMAIL MARKETING',
                    'E-COMMERCE'
                  ].map((service, index) => (
                    <div key={index} className="flex items-center space-x-3 group">
                      <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-300 transition-colors duration-200"></div>
                      <span className="text-white font-semibold text-sm lg:text-base tracking-wide group-hover:text-blue-300 transition-colors duration-200">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom decorative image */}
                <div className="absolute bottom-4 right-4 w-32 h-32 opacity-20">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E40AF" />
                      </linearGradient>
                    </defs>
                    <path d="M50,100 Q100,50 150,100 T250,100" stroke="url(#gradient)" strokeWidth="3" fill="none" opacity="0.6"/>
                    <circle cx="100" cy="100" r="8" fill="url(#gradient)" opacity="0.8"/>
                    <circle cx="150" cy="100" r="8" fill="url(#gradient)" opacity="0.8"/>
                  </svg>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full opacity-60 animate-pulse animation-delay-1000"></div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;