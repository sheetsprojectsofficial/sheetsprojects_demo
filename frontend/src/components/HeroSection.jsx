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
  // Brand name now comes from BrandContext (Brand details section), not Hero section
  const sheetsHeroText = getSettingValue('Hero Text', '');
  const sheetsHeroDescription = getSettingValue('Hero Description', '');
  const sheetsButtonName = getSettingValue('Button Name', '');
  const sheetsButtonLink = getSettingValue('Button Link', '');
  const sheetsHeroImageUrl = getSettingValue('Hero Image URL', '');

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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        {/* Brand color accents */}
        <div className="absolute top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--brand-primary)' }}></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--brand-primary)' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Brand Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-brand-primary"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              <span className="text-sm font-medium text-gray-700">
                {brandName || 'Welcome'}
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-gray-900">
                  {sheetsHeroText?.split(' ').slice(0, -2).join(' ') || 'Transform Your'}
                </span>
                <br />
                <span className="text-brand-primary">
                  {sheetsHeroText?.split(' ').slice(-2).join(' ') || 'Business Today'}
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {sheetsHeroDescription || 'Your one-stop solution for Google Sheets projects and automation.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={handleCTAClick}
                className={`${themeClasses.primaryButton} group relative cursor-pointer px-8 py-4 rounded-xl text-lg font-semibold overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {sheetsButtonName || 'Get Started'}
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' }}>
                  <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Free Consultation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' }}>
                  <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' }}>
                  <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Secure & Reliable</span>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Visual */}
          <div className="relative">
            {sheetsHeroImageUrl ? (
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                  <img
                    src={optimizeImageUrl(sheetsHeroImageUrl, { width: 1200, height: 800, smartCrop: false })}
                    alt="Hero"
                    className="w-full h-auto object-contain bg-white"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.closest('.relative').style.display = 'none';
                      document.querySelector('.hero-fallback-visual')?.classList.remove('hidden');
                    }}
                  />
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-full shadow-lg p-3 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Fallback Visual */}
            <div className={`hero-fallback-visual ${sheetsHeroImageUrl ? 'hidden' : ''}`}>
              <div className="relative bg-gray-50 rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-100 overflow-hidden">
                {/* Services Grid */}
                <div className="relative z-10">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' }}>
                      <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    Our Services
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'App Script Development', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
                      { name: 'Social Media Automation', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                      { name: 'Website Development', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
                      { name: 'WhatsApp Automation', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                      { name: 'Email Marketing', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                      { name: 'E-Commerce Solutions', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }
                    ].map((service, index) => (
                      <div key={index} className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-primary/30 hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm group-hover:text-brand-primary transition-colors">
                          {service.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Stats Card for Fallback */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">200+</p>
                    <p className="text-xs text-gray-500">Happy Clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
