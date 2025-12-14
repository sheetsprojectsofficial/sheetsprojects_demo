import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const FooterContext = createContext();

export const useFooter = () => {
  const context = useContext(FooterContext);
  if (!context) {
    throw new Error('useFooter must be used within a FooterProvider');
  }
  return context;
};

export const FooterProvider = ({ children }) => {
  const { settings, getSettingValue } = useSettings();
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFooterDataFromGoogleSheets();
  }, [settings]);

  const loadFooterDataFromGoogleSheets = () => {
    if (!settings || Object.keys(settings).length === 0) {
      setLoading(true);
      return;
    }

    // Company Info - Only description is used in footer
    const companyInfo = {
      description: getSettingValue('Description', '')
    };
    
    // Main controls
    const quickLinkEnabled = true; // Always enabled now since we're using navigation
    const termsLinkEnabled = true; // Always enabled to show all policy pages
    const socialMediaEnabled = getSettingValue('Social Media Enabled', false);
    const copyrightText = getSettingValue('Copyright Text', '');

    // Build links
    const quickLinks = [];
    const socialMediaLinks = {};

    // Menu options mapping
    const menuOptionsMapping = [
      { name: 'Products', href: '/products', settingKey: 'Products' },
      { name: 'Blog', href: '/blog', settingKey: 'Blog' },
      { name: 'Showcase', href: '/showcase', settingKey: 'Showcase' },
      { name: 'Book', href: '/book', settingKey: 'Books' },
      { name: 'Courses', href: '/courses', settingKey: 'Courses' },
      { name: 'Bookings', href: '/bookings', settingKey: 'Bookings' },
      { name: 'Invoices', href: '/invoices', settingKey: 'Invoices' },
      { name: 'Portfolio', href: '/portfolio', settingKey: 'Portfolio' },
      { name: 'Webinar', href: '/webinar', settingKey: 'Webinar' },
      { name: 'Events', href: '/events', settingKey: 'Events' },
      { name: 'Trainings', href: '/trainings', settingKey: 'Trainings' },
    ];

    // Quick Links
    menuOptionsMapping.forEach(menuOption => {
      const isVisible = getSettingValue(menuOption.settingKey, false);

      if (isVisible === true || isVisible === 'TRUE' || isVisible === 'true') {
        quickLinks.push({
          text: menuOption.name,
          url: menuOption.href,
          enabled: true
        });
      }
    });

    quickLinks.push({
      text: 'About Us',
      url: '/about',
      enabled: true
    });

    // Terms Links
    const termsLinks = [
      {
        text: 'Shipping Policy',
        url: '/shipping',
        enabled: true
      },
      {
        text: 'Terms & Conditions',
        url: '/terms',
        enabled: true
      },
      {
        text: 'Cancellations & Refunds',
        url: '/cancellations-refunds',
        enabled: true
      },
      {
        text: 'Privacy Policy',
        url: '/privacy',
        enabled: true
      },
      {
        text: 'Refund Policy',
        url: '/refund-policy',
        enabled: true
      },
      {
        text: 'Pricing Policy',
        url: '/pricing-policy',
        enabled: true
      }
    ];
    
    const facebookURL = getSettingValue('Facebook URL', '');
    const twitterURL = getSettingValue('Twitter URL', '');
    const instagramURL = getSettingValue('Instagram URL', '');
    const linkedinURL = getSettingValue('LinkedIn URL', '');
    const youtubeURL = getSettingValue('YouTube URL', '');
    
    if (facebookURL) socialMediaLinks.facebook = { enabled: true, url: facebookURL };
    if (twitterURL) socialMediaLinks.twitter = { enabled: true, url: twitterURL };
    if (instagramURL) socialMediaLinks.instagram = { enabled: true, url: instagramURL };
    if (linkedinURL) socialMediaLinks.linkedin = { enabled: true, url: linkedinURL };
    if (youtubeURL) socialMediaLinks.youtube = { enabled: true, url: youtubeURL };

    const processedFooterData = {
      companyInfo,
      quickLinks: {
        enabled: quickLinkEnabled,
        title: 'Quick Links',
        links: quickLinks
      },
      terms: {
        enabled: termsLinkEnabled,
        title: 'Terms',
        links: termsLinks
      },
      socialMedia: {
        enabled: socialMediaEnabled,
        links: socialMediaLinks
      },
      copyright: {
        text: copyrightText,
        links: []
      }
    };


    setFooterData(processedFooterData);
    setLoading(false);
  };

  const value = {
    footerData,
    loading,
    error: null
  };

  return (
    <FooterContext.Provider value={value}>
      {children}
    </FooterContext.Provider>
  );
};