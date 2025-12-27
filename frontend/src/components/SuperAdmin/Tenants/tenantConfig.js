// All available features for tenants
export const ALL_FEATURES = {
  // Core Features
  dashboard: { label: 'Dashboard', category: 'Core' },
  userManagement: { label: 'User Management', category: 'Core' },
  googleSheetsSync: { label: 'Google Sheets Sync', category: 'Core' },

  // Content Features
  products: { label: 'Products', category: 'Content' },
  blog: { label: 'Blog', category: 'Content' },
  books: { label: 'Books', category: 'Content' },
  portfolio: { label: 'Portfolio', category: 'Content' },
  courses: { label: 'Courses', category: 'Content' },
  webinar: { label: 'Webinar', category: 'Content' },

  // E-Commerce Features
  orders: { label: 'Orders', category: 'E-Commerce' },
  cart: { label: 'Cart', category: 'E-Commerce' },
  payments: { label: 'Payments', category: 'E-Commerce' },

  // Booking Features
  bookings: { label: 'Bookings', category: 'Booking' },

  // Marketing & CRM
  crm: { label: 'CRM / Leads', category: 'Marketing' },
  emailCampaigns: { label: 'Email Campaigns', category: 'Marketing' },
  coldEmail: { label: 'Cold Email Finder', category: 'Marketing' },
  automation: { label: 'Automation', category: 'Marketing' },

  // Communication
  contactForm: { label: 'Contact Form', category: 'Communication' },

  // Customization
  customBranding: { label: 'Custom Branding', category: 'Customization' },
  customNavigation: { label: 'Custom Navigation', category: 'Customization' },
  policyPages: { label: 'Policy Pages', category: 'Customization' },
  aboutPage: { label: 'About Us Page', category: 'Customization' },
};

// Core features that are always enabled
export const CORE_FEATURES = ['dashboard', 'userManagement', 'googleSheetsSync'];

// Default customization features
export const DEFAULT_CUSTOMIZATION = ['customBranding', 'customNavigation', 'policyPages'];

// E-commerce features (auto-enabled when sellable features are on)
export const ECOMMERCE_FEATURES = ['orders', 'cart', 'payments'];

// Sellable features that trigger e-commerce
export const SELLABLE_FEATURES = ['products', 'books', 'courses'];

// Category display order
export const CATEGORY_ORDER = ['Core', 'Content', 'E-Commerce', 'Booking', 'Marketing', 'Communication', 'Customization'];

// Get initial form data
export const getInitialFormData = () => ({
  name: '',
  ownerName: '',
  ownerEmail: '',
  phone: '',
  customDomain: '',
  frontendDomains: [],
  features: Object.keys(ALL_FEATURES).reduce((acc, key) => {
    acc[key] = [...CORE_FEATURES, ...DEFAULT_CUSTOMIZATION].includes(key);
    return acc;
  }, {})
});

// Get initial credentials data
export const getInitialCredentialsData = () => ({
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    clientEmail: '',
    privateKey: ''
  },
  mongodb: {
    uri: ''
  },
  razorpay: {
    keyId: '',
    secretKey: ''
  },
  email: {
    user: '',
    password: ''
  },
  googleSheets: {
    productsSheetId: '',
    settingsSheetId: '',
    settingsSheetName: 'Settings',
    blogsFolderId: '',
    booksFolderId: '',
    contactSheetId: '',
    bookingsSheetId: '',
    webinarSheetId: '',
    portfolioTemplatesFolderId: ''
  },
  cloudinary: {
    cloudName: '',
    apiKey: '',
    apiSecret: ''
  },
  recaptcha: {
    siteKey: '',
    secretKey: ''
  },
  policyDocs: {
    aboutUsDocId: '',
    shippingPolicyDocId: '',
    termsConditionsDocId: '',
    cancellationsRefundsDocId: '',
    privacyPolicyDocId: '',
    refundPolicyDocId: '',
    pricingPolicyDocId: ''
  },
  bookingCalendars: {
    room1CalendarId: '',
    room2CalendarId: '',
    room3CalendarId: ''
  },
  googleApis: {
    customSearchApiKey: '',
    searchEngineId: '',
    geminiApiKey: '',
    driveApiKey: ''
  }
});

// Helper to format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper to check if a value is masked
export const isMaskedValue = (value) => {
  return value && value.includes('•');
};
