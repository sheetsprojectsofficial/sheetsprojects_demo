import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LandingPageManager from './LandingPageManager';
import AdminProducts from './AdminProducts';
import AdminBlogs from './AdminBlogs';
import AdminBooks from './AdminBooks';
import Orders from './Orders';
import CustomerDashboard from './CustomerDashboard';
import AdminBookings from './AdminBookings';

const Dashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'landing');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'landing';
    setActiveTab(tab);
  }, [searchParams]);

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
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-sm`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
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
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto scroll-smooth" style={{ minHeight: 0 }}>
            {isAdmin() ? (
              <nav className="px-2 py-4 space-y-1">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</h3>
                </div>
                <button
                  onClick={() => handleTabChange('landing')}
                  className={`${activeTab === 'landing' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">🏠</span>
                  <span className="flex-1 text-left">Landing Page</span>
                </button>
                <button
                  onClick={() => handleTabChange('products')}
                  className={`${activeTab === 'products' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">📦</span>
                  <span className="flex-1 text-left">Products</span>
                </button>
                <button
                  onClick={() => handleTabChange('blogs')}
                  className={`${activeTab === 'blogs' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">📝</span>
                  <span className="flex-1 text-left">Blogs</span>
                </button>
                <button
                  onClick={() => handleTabChange('books')}
                  className={`${activeTab === 'books' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">📚</span>
                  <span className="flex-1 text-left">Books</span>
                </button>
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`${activeTab === 'orders' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">📋</span>
                  <span className="flex-1 text-left">Orders</span>
                </button>
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`${activeTab === 'bookings' ? 'bg-blue-50 border-blue-200 text-brand-primary' : 'text-gray-700 border-gray-200 hover:bg-gray-50'} group flex items-center cursor-pointer px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200 w-full`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <span className="text-lg mr-3">🏨</span>
                  <span className="flex-1 text-left">Bookings</span>
                </button>
              </nav>
            ) : (
              <nav className="px-2 py-4 space-y-1">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Account</h3>
                </div>
                <div className="px-3 py-3 text-sm font-medium text-brand-primary bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🛒</span>
                    <span className="flex-1 text-left">My Purchases</span>
                  </div>
                </div>
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
          <div className="py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {isAdmin() ? (
                <div className="space-y-6">
                  {activeTab === 'landing' && <LandingPageManager />}
                  {activeTab === 'products' && <AdminProducts />}
                  {activeTab === 'blogs' && <AdminBlogs />}
                  {activeTab === 'books' && <AdminBooks />}
                  {activeTab === 'orders' && <Orders />}
                  {activeTab === 'bookings' && <AdminBookings />}
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