import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import LandingPageManager from './LandingPageManager';
import AdminProducts from './AdminProducts';
import AdminBlogs from './AdminBlogs';
import AdminBooks from './AdminBooks';
import Orders from './Orders';
import CustomerDashboard from './CustomerDashboard';
import AdminBookings from './AdminBookings';
import Invoices from './Invoices';
import EmailFinder from './ColdEmail';
import EmailCampaign from './EmailCampaign/EmailCampaign';
import CRMList from './EmailCampaign/CRMList';
import { AutomationList } from './Automation';
import { toast } from 'react-toastify';
import { apiFetch, getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

const Dashboard = () => {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (isAdmin() ? 'landing' : 'purchases'));
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Redirect superadmin to superadmin dashboard
  useEffect(() => {
    if (isSuperAdmin()) {
      navigate('/superadmin-dashboard', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Get enabled menu items from settings (except Home)
  const getEnabledMenuItems = () => {
    if (!settings || Object.keys(settings).length === 0) return [];

    const keys = Object.keys(settings);
    const menuOptionsIndex = keys.findIndex(key => key === 'Menu options');
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');

    if (menuOptionsIndex === -1 || ourWorkSectionIndex === -1) return [];

    const navigationKeys = keys.slice(menuOptionsIndex + 1, ourWorkSectionIndex);
    const enabledItems = [];

    navigationKeys.forEach(key => {
      // Skip 'Home' and 'Contact' - we don't need them in admin
      if (key.toLowerCase() === 'home' || key.toLowerCase() === 'contact') return;

      const setting = settings[key];
      let isEnabled = false;

      if (typeof setting === 'object' && setting.hasOwnProperty('value')) {
        if (typeof setting.value === 'boolean') {
          isEnabled = setting.value;
        } else if (typeof setting.value === 'string') {
          const value = setting.value.toLowerCase().trim();
          isEnabled = value === 'show' || value === 'true' || value === '1' || value === 'yes' || value === 'on';
        } else if (setting.value === true || setting.value === 1) {
          isEnabled = true;
        }
      }

      if (isEnabled) {
        enabledItems.push(key);
      }
    });

    return enabledItems;
  };

  const enabledMenuItems = getEnabledMenuItems();

  // Map menu items to their tab names and icons
  const menuItemConfig = {
    'Products': { tab: 'products', icon: '📦', label: 'Products' },
    'Blog': { tab: 'blogs', icon: '📝', label: 'Blogs' },
    'Blogs': { tab: 'blogs', icon: '📝', label: 'Blogs' },
    'Contact': { tab: 'contact', icon: '📞', label: 'Contact' },
    'Bookings': { tab: 'bookings', icon: '🏨', label: 'Bookings' },
    'Books': { tab: 'books', icon: '📚', label: 'Books' },
    'Orders': { tab: 'orders', icon: '📋', label: 'Orders' },
    'Portfolio': { tab: 'portfolio', icon: '💼', label: 'Portfolio' },
    'Courses': { tab: 'courses', icon: '🎓', label: 'Courses' },
    'Invoices': { tab: 'invoices', icon: '🧾', label: 'Invoice' }
  };

  useEffect(() => {
    const tab = searchParams.get('tab') || (isAdmin() ? 'landing' : 'purchases');
    setActiveTab(tab);
  }, [searchParams, isAdmin]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); 
      } else {
        setSidebarOpen(false); 
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const syncAll = async () => {
    if (!user || !isAdmin()) return;

    setSyncing(true);
    setSyncStatus('Starting sync...');
    const results = {
      products: { success: false, message: '' },
      blogs: { success: false, message: '' },
      books: { success: false, message: '' },
      orders: { success: false, message: '' },
      bookings: { success: false, message: '' }
    };

    try {
      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Sync Products (just refresh the data)
      setSyncStatus('Syncing products...');
      try {
        const response = await apiFetch(`${API_URL}/products`, { headers });
        const data = await response.json();
        results.products.success = data.success;
        results.products.message = data.success ? 'Products refreshed' : 'Products failed';
      } catch (error) {
        results.products.message = `Products error: ${error.message}`;
      }

      // Sync Blogs
      setSyncStatus('Syncing blogs from Drive...');
      try {
        const response = await apiFetch(`${API_URL}/blog/admin/sync`, {
          method: 'POST',
          headers
        });
        const data = await response.json();
        results.blogs.success = data.success;
        results.blogs.message = data.success
          ? `Blogs: Created ${data.syncResults?.created || 0}, Updated ${data.syncResults?.updated || 0}`
          : 'Blogs sync failed';
      } catch (error) {
        results.blogs.message = `Blogs error: ${error.message}`;
      }

      // Sync Books
      setSyncStatus('Syncing books from Drive...');
      try {
        const response = await apiFetch(`${API_URL}/books/admin/sync`, {
          method: 'POST',
          headers
        });
        const data = await response.json();
        results.books.success = data.success;
        results.books.message = data.success
          ? `Books: Created ${data.syncResults?.created || 0}, Updated ${data.syncResults?.updated || 0}`
          : 'Books sync failed';
      } catch (error) {
        results.books.message = `Books error: ${error.message}`;
      }

      // Sync Orders Solution Links
      setSyncStatus('Syncing order solutions...');
      try {
        const response = await apiFetch(`${API_URL}/orders/solution/sync-from-sheets`, {
          method: 'POST',
          headers
        });
        const data = await response.json();
        results.orders.success = data.success;
        results.orders.message = data.success
          ? `Orders: ${data.details?.ordersUpdated || 0} updated`
          : 'Orders sync failed';
      } catch (error) {
        results.orders.message = `Orders error: ${error.message}`;
      }

      // Sync Bookings (refresh)
      setSyncStatus('Refreshing bookings...');
      try {
        const response = await apiFetch(`${API_URL}/bookings`, {
          headers
        });
        const data = await response.json();
        results.bookings.success = data.success;
        results.bookings.message = data.success ? 'Bookings refreshed' : 'Bookings failed';
      } catch (error) {
        results.bookings.message = `Bookings error: ${error.message}`;
      }

      // Show summary
      const successCount = Object.values(results).filter(r => r.success).length;
      const totalCount = Object.keys(results).length;

      if (successCount === totalCount) {
        toast.success(`✅ All data synced successfully!`);
      } else {
        toast.warning(`⚠️ Sync completed with some issues (${successCount}/${totalCount} successful)`);
      }

      setSyncStatus('Sync completed!');

      // Reload the current page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('❌ Sync failed: ' + error.message);
      setSyncStatus('Sync failed');
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncStatus('');
      }, 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Hidden by default on mobile, always visible on desktop */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-20 overflow-visible' : 'w-64'} bg-white shadow-2xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-sm`}>
        <div className={`h-full flex flex-col relative ${sidebarCollapsed ? 'overflow-visible' : ''}`}>
          {/* Collapse Toggle Button - Desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Sidebar Header */}
          <div className={`flex-shrink-0 ${sidebarCollapsed ? 'px-5' : 'px-6'} ${sidebarCollapsed ? 'py-5' : 'py-4'} border-b border-gray-100 bg-white`}>
            <div className="flex items-center justify-between">
              {sidebarCollapsed ? (
                <div className="w-full flex justify-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {isAdmin() ? 'Admin Dashboard' : 'Customer Dashboard'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isAdmin() ? 'Manage your website content' : 'View your purchased products'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary lg:hidden ml-4"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className={`flex-1 scroll-smooth ${sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`} style={{ minHeight: 0 }}>
            {isAdmin() ? (
              <nav className={`${sidebarCollapsed ? 'px-2' : 'px-2'} py-4 space-y-1`}>
                {!sidebarCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</h3>
                  </div>
                )}

                {/* Landing Page - Always on top */}
                <button
                  onClick={() => handleTabChange('landing')}
                  className={`${activeTab === 'landing' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>🏠</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Landing Page</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Landing Page
                    </span>
                  )}
                </button>

                {/* Dynamic menu items from settings */}
                {enabledMenuItems.map(item => {
                  const config = menuItemConfig[item];
                  if (!config) return null;
                  return (
                    <button
                      key={item}
                      onClick={() => handleTabChange(config.tab)}
                      className={`${activeTab === config.tab ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                    >
                      <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>{config.icon}</span>
                      {!sidebarCollapsed && <span className="flex-1 text-left">{config.label}</span>}
                      {sidebarCollapsed && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {config.label}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Orders - Always show if Products is enabled */}
                {enabledMenuItems.includes('Products') && (
                  <button
                    onClick={() => handleTabChange('orders')}
                    className={`${activeTab === 'orders' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                  >
                    <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>📋</span>
                    {!sidebarCollapsed && <span className="flex-1 text-left">Orders</span>}
                    {sidebarCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        Orders
                      </span>
                    )}
                  </button>
                )}

                {!sidebarCollapsed && (
                  <div className="px-3 py-2 mt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</h3>
                  </div>
                )}
                {sidebarCollapsed && <div className="my-2 border-t border-gray-200"></div>}

                {/* Invoice - Always there */}
                <button
                  onClick={() => handleTabChange('invoices')}
                  className={`${activeTab === 'invoices' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>🧾</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Invoice</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Invoice
                    </span>
                  )}
                </button>

                {/* Cold Email Finder - Always there */}
                <button
                  onClick={() => handleTabChange('email-finder')}
                  className={`${activeTab === 'email-finder' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>🔍</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Cold Email Finder</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Cold Email Finder
                    </span>
                  )}
                </button>

                {/* Email Campaign - Always there */}
                <button
                  onClick={() => handleTabChange('email-campaign')}
                  className={`${activeTab === 'email-campaign' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>📨</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Email Campaign</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Email Campaign
                    </span>
                  )}
                </button>

                {/* Leads - Always there */}
                <button
                  onClick={() => handleTabChange('crm')}
                  className={`${activeTab === 'crm' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>👥</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Leads</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Leads
                    </span>
                  )}
                </button>

                {/* Automation - Always there */}
                <button
                  onClick={() => handleTabChange('automation')}
                  className={`${activeTab === 'automation' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>⚡</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">Automation</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Automation
                    </span>
                  )}
                </button>
              </nav>
            ) : (
              <nav className={`${sidebarCollapsed ? 'px-2' : 'px-2'} py-4 space-y-1`}>
                {!sidebarCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Account</h3>
                  </div>
                )}
                <button
                  onClick={() => handleTabChange('purchases')}
                  className={`${activeTab === 'purchases' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full relative`}
                >
                  <span className={`text-lg ${sidebarCollapsed ? '' : 'mr-3'}`}>🛒</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">My Purchases</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      My Purchases
                    </span>
                  )}
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Always visible, full width on mobile */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-row justify-between sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {isAdmin() ? (
                    <>
                      {activeTab === 'landing' && 'Landing Page'}
                      {activeTab === 'products' && 'Products Management'}
                      {activeTab === 'blogs' && 'Blog Management'}
                      {activeTab === 'books' && 'Book Management'}
                      {activeTab === 'orders' && 'Orders Management'}
                      {activeTab === 'bookings' && 'Room Bookings Management'}
                      {activeTab === 'invoices' && 'Invoice Generator'}
                      {activeTab === 'email-finder' && 'Cold Email Finder'}
                      {activeTab === 'email-campaign' && 'Email Campaign Management'}
                      {activeTab === 'crm' && 'Leads - Contacts'}
                      {activeTab === 'automation' && 'Automation'}
                    </>
                  ) : (
                    'My Purchases'
                  )}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {isAdmin() ? (
                    <>
                      {activeTab === 'landing' && 'Edit your website content'}
                      {activeTab === 'products' && 'Manage products from Google Sheets'}
                      {activeTab === 'blogs' && 'Manage blogs from Google Drive DOCX files'}
                      {activeTab === 'books' && 'Manage books from Google Drive folders'}
                      {activeTab === 'orders' && 'View and manage customer orders'}
                      {activeTab === 'bookings' && 'View and manage room bookings'}
                      {activeTab === 'invoices' && 'Create and download professional invoices'}
                      {activeTab === 'email-finder' && 'Find cold emails from any website'}
                      {activeTab === 'email-campaign' && 'Create and manage email campaigns'}
                      {activeTab === 'crm' && 'Manage your contacts extracted from visiting cards'}
                      {activeTab === 'automation' && 'View and manage your lead collection automations'}
                    </>
                  ) : (
                    'View and access your purchased solutions'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              <div className="items-center space-x-2 hidden lg:flex">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block truncate max-w-32">
                  {user?.displayName || user?.email || 'User'}
                </span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {isAdmin() && (
                  <button
                    onClick={syncAll}
                    disabled={syncing}
                    className="px-3 py-2 sm:px-4 cursor-pointer text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md whitespace-nowrap"
                    title="Sync all data sources (Products, Blogs, Books, Orders, Bookings)"
                  >
                    {syncing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">{syncStatus}</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync All</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="px-3 py-2 sm:px-4 cursor-pointer text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  View Site
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 sm:px-4 cursor-pointer text-xs sm:text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth min-h-0">
          <div className={
            activeTab === 'invoices'
              ? ''
              : activeTab === 'crm'
                ? 'px-4 py-0'
                : 'py-4 px-4 sm:px-6'
          }>
            <div className="max-w-7xl mx-auto">
              {isAdmin() ? (
                <div className="space-y-6">
                  {activeTab === 'invoices' && <Invoices />}
                  {activeTab === 'landing' && <LandingPageManager />}
                  {activeTab === 'products' && <AdminProducts />}
                  {activeTab === 'blogs' && <AdminBlogs />}
                  {activeTab === 'books' && <AdminBooks />}
                  {activeTab === 'orders' && <Orders />}
                  {activeTab === 'bookings' && <AdminBookings />}
                  {activeTab === 'email-finder' && <EmailFinder />}
                  {activeTab === 'email-campaign' && <EmailCampaign />}
                  {activeTab === 'crm' && <CRMList />}
                  {activeTab === 'automation' && <AutomationList />}
                </div>
              ) : (
                <CustomerDashboard />
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-gray-500">
              © 2025 sheetsprojects.com. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{isAdmin() ? 'Admin Dashboard' : 'Customer Dashboard'}</span>
              <span className="hidden sm:inline">•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard; 