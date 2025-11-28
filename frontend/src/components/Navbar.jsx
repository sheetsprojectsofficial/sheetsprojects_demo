import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { NavigationContext } from '../context/NavigationContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBrand } from '../context/BrandContext';
import { useTheme } from '../hooks/useTheme';
import { convertImageUrl } from '../utils/imageUtils';
import SubNavbar from './SubNavbar';

const Navbar = () => {
  const { navigationItems } = useContext(NavigationContext);
  const { settings, getSettingValue } = useSettings();
  const { isAuthenticated, logout, user, isAdmin } = useAuth();
  const { cart } = useCart();
  const { brandName: contextBrandName } = useBrand();
  const { getThemeClasses } = useTheme();

  const themeClasses = getThemeClasses();

  // Get brand name from settings (Google Sheets) - prioritize this over context
  const sheetsBrandName = getSettingValue('Brand Name', '') || getSettingValue('Brand name', '');
  const brandName = sheetsBrandName || contextBrandName;

  // Get logo URL from settings and convert to usable format
  const rawLogoUrl = getSettingValue('Logo URL', '') || getSettingValue('logo url', '') || getSettingValue('Logo url', '');
  const logoUrl = rawLogoUrl ? convertImageUrl(rawLogoUrl) : '';
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navDropdownRef = useRef(null);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNavDropdownOpen(false); // Close nav dropdown when opening user dropdown
  };

  const toggleNavDropdown = () => {
    setIsNavDropdownOpen(!isNavDropdownOpen);
    setIsUserDropdownOpen(false); // Close user dropdown when opening nav dropdown
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setIsNavDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create navigation items from Google Sheets data (same logic as NavigationManager)
  const createSheetsNavigationItems = () => {
    if (!settings || Object.keys(settings).length === 0) return [];
    
    const navigationItems = [];
    const keys = Object.keys(settings);
    
    // Find the positions of "Menu options" and "Our Work Section"
    const menuOptionsIndex = keys.findIndex(key => key === 'Menu options');
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');
    
    // If we can't find these markers, return empty array
    if (menuOptionsIndex === -1 || ourWorkSectionIndex === -1) {
      return navigationItems;
    }
    
    // Get only the keys between "Menu options" and "Our Work Section"
    const navigationKeys = keys.slice(menuOptionsIndex + 1, ourWorkSectionIndex);
    
    navigationKeys.forEach(key => {
      const setting = settings[key];

      // Include all navigation items and check the 'Show' column value
      if (typeof setting === 'object' && setting.hasOwnProperty('value')) {
        // The visibility is determined by the 'Show' column value (true/false or "Show"/"Hide")
        let isVisible = false;

        if (typeof setting.value === 'boolean') {
          isVisible = setting.value;
        } else if (typeof setting.value === 'string') {
          // Check for various possible string values from Google Sheets checkboxes
          const value = setting.value.toLowerCase().trim();
          isVisible = value === 'show' || value === 'true' || value === '1' || value === 'yes' || value === 'on';
        } else if (setting.value === true || setting.value === 1) {
          isVisible = true;
        }

        navigationItems.push({
          id: key.toLowerCase().replace(/\s+/g, ''),
          name: key,
          visible: isVisible,
          href: key.toLowerCase() === 'home' ? '/' : `/${key.toLowerCase().replace(/\s+/g, '-')}`, // Home goes to /, others to their paths with spaces converted to hyphens
          fromSheets: true
        });
      }
    });
    
    return navigationItems;
  };

  const sheetsNavigationItems = createSheetsNavigationItems();
  
  // Use Google Sheets data if available, otherwise fallback to context
  const allNavigationItems = sheetsNavigationItems.length > 0 ? sheetsNavigationItems : navigationItems;
  
  // Filter visible navigation items
  const visibleNavItems = allNavigationItems.filter(item => item.visible);
  
  // Smart responsive navigation - show max items based on screen size
  const getMaxVisibleItems = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 6; // xl screens
      if (window.innerWidth >= 1024) return 5; // lg screens  
      if (window.innerWidth >= 768) return 4;  // md screens
    }
    return 4; // default
  };
  
  const [maxVisibleItems, setMaxVisibleItems] = useState(getMaxVisibleItems());
  
  // Update max visible items on resize
  useEffect(() => {
    const handleResize = () => {
      setMaxVisibleItems(getMaxVisibleItems());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Split navigation items
  const directNavItems = visibleNavItems.slice(0, maxVisibleItems);
  const dropdownNavItems = visibleNavItems.slice(maxVisibleItems);
  const hasDropdownItems = dropdownNavItems.length > 0;

  // Get user's name initial
  const getUserInitial = () => {
    if (!user?.displayName) return 'U';
    return user.displayName.charAt(0).toUpperCase();
  };

  // Get user role
  const getUserRole = () => {
    if (isAdmin()) return 'Admin';
    return 'User';
  };

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user?.displayName) return 'User';
    return user.displayName;
  };

  return (
    <>
      <SubNavbar />
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center group">
              {logoUrl ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={brandName || 'Logo'}
                    className="w-full h-full object-contain rounded-md transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error('Logo failed to load:', logoUrl);
                      console.error('Error details:', e);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md items-center justify-center transition-colors duration-200 hidden"
                       style={{
                         backgroundColor: 'var(--brand-primary)',
                         '&:hover': { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, black)' }
                       }}
                       onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 80%, black)'}
                       onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--brand-primary)'}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center mr-2 sm:mr-3 transition-colors duration-200" 
                     style={{ 
                       backgroundColor: 'var(--brand-primary)', 
                       '&:hover': { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, black)' } 
                     }} 
                     onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 80%, black)'}
                     onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--brand-primary)'}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 transition-colors duration-200 hover:text-brand-primary">
                {brandName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex flex-1 justify-center mx-4 md:mx-6 lg:mx-8">
            <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-3">
              {directNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => {
                    // Ensure smooth scroll to top when clicking navigation links
                    setTimeout(() => {
                      window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                      });
                    }, 50);
                  }}
                  className={`relative px-2 md:px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group whitespace-nowrap ${
                    (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                      ? 'text-white'
                      : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                  }`}
                  style={
                    (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                      ? { backgroundColor: 'var(--brand-primary)' }
                      : {}
                  }
                >
                  {item.name}
                  {/* Hover underline - only show when not active */}
                  {!(location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/'))) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                  )}
                </Link>
              ))}
              
              {/* More Items Dropdown - Only show if there are items to show */}
              {hasDropdownItems && (
                <div className="relative" ref={navDropdownRef}>
                  <button
                    onClick={toggleNavDropdown}
                    className={`relative px-2 md:px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group whitespace-nowrap flex items-center space-x-1 border ${
                      isNavDropdownOpen
                        ? 'border-brand-primary text-brand-primary bg-white'
                        : dropdownNavItems.some(item => 
                            location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/'))
                          )
                          ? 'text-white border-transparent'
                          : 'text-gray-700 border-transparent hover:text-brand-primary hover:bg-gray-50'
                    }`}
                    style={
                      !isNavDropdownOpen && dropdownNavItems.some(item => 
                        location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/'))
                      )
                        ? { backgroundColor: 'var(--brand-primary)' }
                        : {}
                    }
                  >
                    <span>More</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isNavDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Navigation Dropdown Menu */}
                  {isNavDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
                      {dropdownNavItems.map((item) => (
                        <Link
                          key={item.id}
                          to={item.href}
                          onClick={() => {
                            setIsNavDropdownOpen(false);
                            setTimeout(() => {
                              window.scrollTo({
                                top: 0,
                                left: 0,
                                behavior: 'smooth'
                              });
                            }, 50);
                          }}
                          className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                            (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                              ? 'text-white'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-brand-primary'
                          }`}
                          style={
                            (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                              ? { backgroundColor: 'var(--brand-primary)' }
                              : {}
                          }
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - User Actions */}
          <div className="hidden md:flex items-center space-x-2 ml-auto">

            {/* Cart Icon - Show for authenticated users */}
            {isAuthenticated() && (
              <Link
                to="/cart"
                className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Actions - Always show for authenticated users */}
            {isAuthenticated() && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center justify-center cursor-pointer space-x-2 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                       style={{ backgroundColor: 'var(--brand-primary)' }}>
                    {getUserInitial()}
                  </div>
                  <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-40 border border-gray-200 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 bg-gray-50">
                      <div className="font-semibold text-gray-900">{getUserDisplayName()}</div>
                      <div className="text-xs text-gray-500 mt-1">{getUserRole()}</div>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleDashboardClick();
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                      {isAdmin() ? 'Dashboard' : 'My Account'}
                    </button>

                    <button
                      onClick={() => {
                        handleLogoutClick();
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-3 cursor-pointer text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Login Button - Only show when not authenticated */}
            {!isAuthenticated() && (
              <button
                onClick={handleLoginClick}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors duration-200 cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--brand-primary)',
                  '&:hover': { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, black)' }
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 80%, black)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--brand-primary)'}
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto">
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors duration-200 cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {/* Mobile Navigation Items */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Ensure smooth scroll to top when clicking mobile navigation links
                      setTimeout(() => {
                        window.scrollTo({
                          top: 0,
                          left: 0,
                          behavior: 'smooth'
                        });
                      }, 50);
                    }}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                        ? 'text-white'
                        : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                    }`}
                    style={
                      (location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/')))
                        ? { backgroundColor: 'var(--brand-primary)' }
                        : {}
                    }
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Mobile User Actions */}
              {isAuthenticated() ? (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700 px-3 py-2">
                    Welcome, {user?.displayName}
                  </div>
                  <button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white transition-colors duration-200"
                    style={{ 
                      backgroundColor: 'var(--brand-primary)',
                      '&:hover': { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, black)' }
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 80%, black)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--brand-primary)'}
                  >
                    {isAdmin() ? 'Dashboard' : 'My Account'}
                  </button>
                  <button
                    onClick={() => {
                      handleLogoutClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLoginClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white transition-colors duration-200"
                    style={{ 
                      backgroundColor: 'var(--brand-primary)',
                      '&:hover': { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, black)' }
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 80%, black)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--brand-primary)'}
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navbar; 