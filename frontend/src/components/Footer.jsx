import React from 'react';
import { Link } from 'react-router-dom';
import { useFooter } from '../context/FooterContext';
import { useBrand } from '../context/BrandContext';
import { useSettings } from '../context/SettingsContext';
import { convertImageUrl } from '../utils/imageUtils';

const Footer = () => {
  const { footerData, loading } = useFooter();
  const { brandName, logoUrl } = useBrand();
  const { getSettingValue } = useSettings();

  // Get phone and email from Contact Us Section settings
  const contactEmail = getSettingValue('Email Address', '');
  const contactPhone = getSettingValue('Phone Number', '');

  // Convert logo URL to usable format
  const convertedLogoUrl = logoUrl ? convertImageUrl(logoUrl) : '';

  if (loading || !footerData) {
    return (
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const renderSocialIcon = (platform) => {
    const icons = {
      facebook: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      youtube: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    };
    return icons[platform] || null;
  };

  const handleLinkClick = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 50);
  };

  const renderLinks = (links) => {
    if (!links || !Array.isArray(links)) return null;

    return (
      <ul className="space-y-3">
        {links.filter(link => link.enabled).map((link, index) => (
          <li key={index}>
            <Link
              to={link.url}
              onClick={handleLinkClick}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm flex items-center gap-2 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-brand-primary transition-colors"></span>
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <footer className="relative bg-gray-50 overflow-hidden border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {convertedLogoUrl ? (
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <img
                    src={convertedLogoUrl}
                    alt={brandName || 'Logo'}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-10 h-10 rounded-xl bg-brand-primary items-center justify-center hidden">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {brandName || footerData.companyInfo?.name || 'Company'}
              </h3>
            </div>

            {footerData.companyInfo?.description && (
              <p className="text-gray-600 mb-6 leading-relaxed max-w-md">
                {footerData.companyInfo.description}
              </p>
            )}

            <div className="space-y-3">
              {(contactPhone || footerData.companyInfo?.phone) && (
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${contactPhone || footerData.companyInfo?.phone}`} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {contactPhone || footerData.companyInfo?.phone}
                  </a>
                </div>
              )}

              {(contactEmail || footerData.companyInfo?.email) && (
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${contactEmail || footerData.companyInfo?.email}`} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {contactEmail || footerData.companyInfo?.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          {footerData.quickLinks?.enabled && footerData.quickLinks?.links?.length > 0 && (
            <div>
              <h4 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
                {footerData.quickLinks.title || 'Quick Links'}
              </h4>
              {renderLinks(footerData.quickLinks.links)}
            </div>
          )}

          {/* Terms */}
          {footerData.terms?.enabled && footerData.terms?.links?.length > 0 && (
            <div>
              <h4 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
                {footerData.terms.title || 'Legal'}
              </h4>
              {renderLinks(footerData.terms.links)}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            {footerData.copyright?.text && (
              <p className="text-gray-500 text-sm">
                {footerData.copyright.text}
              </p>
            )}

            {/* Copyright Links */}
            {footerData.copyright?.links?.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                {footerData.copyright.links.filter(link => link.enabled).map((link, index) => (
                  <Link
                    key={index}
                    to={link.url}
                    onClick={handleLinkClick}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            )}

            {/* Social Media Icons */}
            {footerData.socialMedia?.enabled && footerData.socialMedia?.links && Object.keys(footerData.socialMedia.links).length > 0 && (
              <div className="flex items-center gap-2">
                {Object.entries(footerData.socialMedia.links).map(([platform, data]) => {
                  if (!data || !data.enabled || !data.url) return null;

                  return (
                    <a
                      key={platform}
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 cursor-pointer rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-white hover:bg-gray-900 hover:border-gray-900 transition-all duration-300"
                      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      aria-label={`Visit our ${platform} page`}
                    >
                      {renderSocialIcon(platform)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Brand Line */}
      <div className="h-1 bg-brand-primary"></div>
    </footer>
  );
};

export default Footer;
