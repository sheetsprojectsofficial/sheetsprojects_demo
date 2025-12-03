import React from 'react';
import { Link } from 'react-router-dom';
import { useFooter } from '../context/FooterContext';
import { useBrand } from '../context/BrandContext';

const Footer = () => {
  const { footerData, loading } = useFooter();
  const { brandName } = useBrand();

  if (loading || !footerData) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
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

  const renderLinks = (links) => {
    if (!links || !Array.isArray(links)) return null;
    
    const handleLinkClick = () => {
      // Ensure smooth scroll to top when clicking footer links
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }, 50);
    };
    
    return (
      <ul className="space-y-2">
        {links.filter(link => link.enabled).map((link, index) => (
          <li key={index}>
            <Link 
              to={link.url} 
              onClick={handleLinkClick}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  // Get the number of columns dynamically
  const getColumnCount = () => {
    let columns = 1; // Always have company info
    if (footerData.quickLinks?.enabled && footerData.quickLinks?.links?.length > 0) columns++;
    if (footerData.terms?.enabled && footerData.terms?.links?.length > 0) columns++;
    return Math.min(columns, 3); // Max 3 columns
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`grid grid-cols-1 ${getColumnCount() > 1 ? `md:grid-cols-${getColumnCount()}` : ''} gap-8`}>
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {footerData.companyInfo?.name || brandName || 'Company'}
            </h3>
            {footerData.companyInfo?.description && (
              <p className="text-gray-300 mb-4">{footerData.companyInfo.description}</p>
            )}
            <div className="space-y-2 text-sm text-gray-300">
              {footerData.companyInfo?.address && <p>{footerData.companyInfo.address}</p>}
              {footerData.companyInfo?.phone && (
                <p>
                  <a href={`tel:${footerData.companyInfo.phone}`} className="hover:text-white transition-colors">
                    {footerData.companyInfo.phone}
                  </a>
                </p>
              )}
              {footerData.companyInfo?.email && (
                <p>
                  <a href={`mailto:${footerData.companyInfo.email}`} className="hover:text-white transition-colors">
                    {footerData.companyInfo.email}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Quick Links - Only show if enabled and has links */}
          {footerData.quickLinks && footerData.quickLinks.enabled && footerData.quickLinks.links && footerData.quickLinks.links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{footerData.quickLinks.title || 'Quick Links'}</h3>
              {renderLinks(footerData.quickLinks.links)}
            </div>
          )}

          {/* Terms - Only show if enabled and has links */}
          {footerData.terms && footerData.terms.enabled && footerData.terms.links && footerData.terms.links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{footerData.terms.title || 'Terms'}</h3>
              {renderLinks(footerData.terms.links)}
            </div>
          )}
        </div>

        {/* Social Media and Copyright in one row */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            {footerData.copyright?.text && (
              <p className="text-gray-300 text-sm mb-4 md:mb-0">
                {footerData.copyright.text}
              </p>
            )}
            
            {/* Copyright Links - positioned in center */}
            {footerData.copyright?.links && footerData.copyright.links.length > 0 && (
              <div className="flex space-x-4 text-sm">
                {footerData.copyright.links.filter(link => link.enabled).map((link, index) => (
                  <Link
                    key={index}
                    to={link.url}
                    onClick={() => {
                      setTimeout(() => {
                        window.scrollTo({
                          top: 0,
                          left: 0,
                          behavior: 'smooth'
                        });
                      }, 50);
                    }}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Social Media Icons - positioned on the far right */}
            {footerData.socialMedia?.enabled && footerData.socialMedia?.links && Object.keys(footerData.socialMedia.links).length > 0 && (
              <div className="flex space-x-4">
                {Object.entries(footerData.socialMedia.links).map(([platform, data]) => {
                  // Skip if data is invalid or URL is missing
                  if (!data || !data.enabled || !data.url) {
                    if (data) {
                      console.log(`Skipping ${platform}: enabled=${data.enabled}, url=${data.url}`);
                    }
                    return null;
                  }
                  
                  const brandColors = {
                    facebook: 'text-blue-500 hover:text-blue-400',
                    twitter: 'text-blue-400 hover:text-blue-300',
                    instagram: 'text-pink-500 hover:text-pink-400',
                    linkedin: 'text-blue-600 hover:text-blue-500',
                    youtube: 'text-red-500 hover:text-red-400'
                  };
                  
                  return (
                    <a
                      key={platform}
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`cursor-pointer transition-colors duration-200 ${brandColors[platform] || 'text-gray-300 hover:text-white'}`}
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
    </footer>
  );
};

export default Footer;