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

    // Company Info - These are fixed fields
    const companyInfo = {
      name: getSettingValue('Company Name', ''),
      email: getSettingValue('Email', ''),
      phone: getSettingValue('Phone', ''),
      address: getSettingValue('Address', ''),
      description: getSettingValue('Description', '')
    };
    
    // Main controls
    const quickLinkEnabled = getSettingValue('Quick Link Enabled', false);
    const termsLinkEnabled = getSettingValue('Terms Link Enabled', false);
    const socialMediaEnabled = getSettingValue('Social Media Enabled', false);
    const copyrightText = getSettingValue('Copyright Text', '');
    
    // Build links based on specific enabled items (non-dynamic approach for now)
    const quickLinks = [];
    const termsLinks = [];
    const socialMediaLinks = {};
    
    // Quick Links - check specific items
    const homeEnabled = getSettingValue('Home', false);
    const productsEnabled = getSettingValue('Products', false);
    const contactUsEnabled = getSettingValue('Contact Us', false);
    
    if (homeEnabled) {
      quickLinks.push({
        text: 'Home',
        url: '/',
        enabled: true
      });
    }
    
    if (productsEnabled) {
      quickLinks.push({
        text: 'Products',
        url: '/products',
        enabled: true
      });
    }
    
    if (contactUsEnabled) {
      quickLinks.push({
        text: 'Contact Us',
        url: '/contact',
        enabled: true
      });
    }
    
    // Terms Links - check specific items
    const termConditionEnabled = getSettingValue('Term & Condition', false);
    const privacyPolicyEnabled = getSettingValue('Privacy Policy', false);
    
    if (termConditionEnabled) {
      termsLinks.push({
        text: 'Terms & Conditions',
        url: '/terms',
        enabled: true
      });
    }
    
    if (privacyPolicyEnabled) {
      termsLinks.push({
        text: 'Privacy Policy',
        url: '/privacy',
        enabled: true
      });
    }
    
    // Social Media URLs
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

    // Structure the data in a format that Footer.jsx expects
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
        links: [] // No copyright links from Google Sheets currently
      }
    };


    setFooterData(processedFooterData);
    setLoading(false);
  };

  const value = {
    footerData,
    loading,
    error: null // No errors from Google Sheets integration
  };

  return (
    <FooterContext.Provider value={value}>
      {children}
    </FooterContext.Provider>
  );
};