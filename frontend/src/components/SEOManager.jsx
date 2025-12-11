import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { useSettings } from '../context/SettingsContext';

/**
 * SEOManager - Comprehensive SEO management component
 * Handles dynamic meta tags, structured data, and SEO optimization
 * Preserves all existing functionality while adding professional SEO features
 */
const SEOManager = () => {
  const { brandName } = useBrand();
  const { getSettingValue } = useSettings();
  const location = useLocation();

  // Get dynamic content from Google Sheets
  const heroDescription = getSettingValue('Hero Description', 'Your one-stop solution for Google Sheets projects and automation.');
  const heroText = getSettingValue('Hero Text', 'SheetsProject. Welcomes You');
  const siteUrl = window.location.origin;

  useEffect(() => {
    updateSEOTags();
  }, [brandName, heroDescription, heroText, location.pathname]);

  const updateSEOTags = () => {
    const currentBrandName = brandName || 'SheetsProjects.com';
    const routes = getRouteConfig();
    const currentRoute = routes[location.pathname] || routes['/'];

    // Update document title (preserving existing functionality)
    document.title = `${currentRoute.title} | ${currentBrandName}`;

    // Update or create meta tags
    updateMetaTag('description', currentRoute.description);
    updateMetaTag('keywords', currentRoute.keywords);
    updateMetaTag('author', currentBrandName);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('language', 'en');
    updateMetaTag('revisit-after', '7 days');

    // Open Graph tags
    updateMetaTag('og:title', `${currentRoute.title} | ${currentBrandName}`, 'property');
    updateMetaTag('og:description', currentRoute.description, 'property');
    updateMetaTag('og:type', currentRoute.type, 'property');
    updateMetaTag('og:url', `${siteUrl}${location.pathname}`, 'property');
    updateMetaTag('og:site_name', currentBrandName, 'property');
    updateMetaTag('og:locale', 'en_US', 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', `${currentRoute.title} | ${currentBrandName}`);
    updateMetaTag('twitter:description', currentRoute.description);
    updateMetaTag('twitter:site', `@${currentBrandName.toLowerCase()}`);

    // Canonical URL
    updateLinkTag('canonical', `${siteUrl}${location.pathname}`);

    // Structured Data
    updateStructuredData(currentBrandName);
  };

  const getRouteConfig = () => ({
    '/': {
      title: heroText || 'SheetsProject. Welcomes You',
      description: heroDescription,
      keywords: 'Google Sheets, automation, app script development, spreadsheet solutions, data analysis, business automation',
      type: 'website'
    },
    '/products': {
      title: 'Products & Services',
      description: 'Explore our comprehensive range of Google Sheets automation solutions, app script development, and business process optimization services.',
      keywords: 'Google Sheets products, automation services, app script, spreadsheet solutions, business tools',
      type: 'website'
    },
    '/blog': {
      title: 'Blog & Resources',
      description: 'Latest insights on Google Sheets automation, tutorials, tips, and best practices for business process optimization.',
      keywords: 'Google Sheets blog, automation tutorials, spreadsheet tips, business process optimization',
      type: 'blog'
    },
    '/contact': {
      title: 'Contact Us',
      description: 'Get in touch with our Google Sheets automation experts. Let us help you streamline your business processes.',
      keywords: 'contact, Google Sheets experts, business automation consultation',
      type: 'website'
    },
    '/showcase': {
      title: 'Portfolio & Showcase',
      description: 'View our portfolio of successful Google Sheets automation projects and business solutions.',
      keywords: 'portfolio, showcase, Google Sheets projects, automation examples',
      type: 'website'
    },
    '/courses': {
      title: 'Courses & Training',
      description: 'Learn Google Sheets automation and app script development through our comprehensive courses and training programs.',
      keywords: 'Google Sheets courses, automation training, app script learning',
      type: 'website'
    },
    '/book': {
      title: 'Book Consultation',
      description: 'Book a consultation with our Google Sheets automation experts to discuss your business needs.',
      keywords: 'consultation booking, Google Sheets expert, business automation consultation',
      type: 'website'
    },
    '/privacy': {
      title: 'Privacy Policy',
      description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
      keywords: 'privacy policy, data protection, user privacy',
      type: 'website'
    },
    '/terms': {
      title: 'Terms & Conditions',
      description: 'Terms and conditions for using our Google Sheets automation services and website.',
      keywords: 'terms and conditions, service terms, legal',
      type: 'website'
    },
    '/shipping': {
      title: 'Shipping Policy',
      description: 'Learn about our shipping and delivery policy for digital and physical products.',
      keywords: 'shipping policy, delivery policy, product delivery',
      type: 'website'
    },
    '/cancellations-refunds': {
      title: 'Cancellations and Refunds',
      description: 'Our policy on order cancellations and refunds for products and services.',
      keywords: 'cancellation policy, refund policy, returns',
      type: 'website'
    }
  });

  const updateMetaTag = (name, content, attribute = 'name') => {
    if (!content) return;

    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  const updateLinkTag = (rel, href) => {
    if (!href) return;

    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  };

  const updateStructuredData = (brandName) => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": brandName,
      "url": siteUrl,
      "description": heroDescription,
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "English"
      },
      "sameAs": [
        `https://twitter.com/${brandName.toLowerCase()}`,
        `https://linkedin.com/company/${brandName.toLowerCase()}`
      ]
    };

    // Remove existing structured data
    const existingScript = document.querySelector('script[data-seo="structured-data"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'structured-data');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  return null; // This component doesn't render anything (preserving original behavior)
};

export default SEOManager;