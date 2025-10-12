import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Import all the new components
import SubNavbarManager from './SubNavbarManager';
import HeroSectionManager from './HeroSectionManager';
import NavigationManager from './NavigationManager';
import PortfolioSectionManager from './PortfolioSectionManager';
import ProductsSectionManager from './ProductsSectionManager';
import ContactSectionManager from './ContactSectionManager';
import FooterSectionManager from './FooterSectionManager';

const LandingPageManager = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState({});

  // Unified message handler for all components
  const handleMessage = (section, message) => {
    setMessages(prev => ({ ...prev, [section]: message }));
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [section]: '' }));
    }, 3000);
  };

  // Message render utility
  const renderMessage = (section) => {
    const message = messages[section];
    if (!message) return null;

    const isSuccess = message.includes('successfully');
    return (
      <div className={`mb-6 p-4 rounded-lg border ${
        isSuccess 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center">
          {isSuccess ? (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <p className="font-medium">{message}</p>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Landing Page Manager</h1>
            <p className="mt-2 text-lg text-gray-600">
              Customize and manage your website's content sections
            </p>
          </div>
        </div>

        {/* Global Message Display */}
        <div className="space-y-4">
          {Object.entries(messages).map(([section]) => (
            <div key={section}>
              {renderMessage(section)}
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {/* Sub Navbar Section */}
          <SubNavbarManager onMessage={handleMessage} />

          {/* Hero Section */}
          <HeroSectionManager onMessage={handleMessage} />

          {/* Navigation Section */}
          <NavigationManager />

          {/* Portfolio Section */}
          <PortfolioSectionManager onMessage={handleMessage} />

          {/* Products Section */}
          <ProductsSectionManager onMessage={handleMessage} />

          {/* Contact Section */}
          <ContactSectionManager onMessage={handleMessage} />

          {/* Footer Section */}
          <FooterSectionManager onMessage={handleMessage} />
        </div>
      </div>
    </div>
  );
};

export default LandingPageManager;