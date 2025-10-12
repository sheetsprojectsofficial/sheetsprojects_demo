import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';

const ContactUs = () => {
  const { settings, getSettingValue } = useSettings();
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();
  const [contactData, setContactData] = useState({
    heading: '',
    subheading: '',
    contactInfo: {
      email: '',
      phone: '',
      businessHours: {
        weekdays: '',
        weekends: ''
      }
    },
    supportInfo: {
      title: '',
      description: '',
      responseTime: ''
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    query: ''
  });

  const [mobileError, setMobileError] = useState('');

  // Load Google Sheets data for contact section
  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    const heading = getSettingValue('Contact Main Heading', '');
    const subheading = getSettingValue('Contact Subheading', '');
    const email = getSettingValue('Email Address', '');
    const phone = getSettingValue('Phone Number', '');
    const weekdays = getSettingValue('Weekdays Hours', '');
    const weekends = getSettingValue('Weekend Hours', '');
    const supportTitle = getSettingValue('Support Title', '');
    const supportDescription = getSettingValue('Support Description', '');
    const responseTime = getSettingValue('Response Time', '');
    
    setContactData({
      heading,
      subheading,
      contactInfo: {
        email,
        phone,
        businessHours: {
          weekdays,
          weekends
        }
      },
      supportInfo: {
        title: supportTitle,
        description: supportDescription,
        responseTime
      }
    });
  };

  // Load Google Sheets data when settings change
  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const validateMobileNumber = (value) => {
    // Remove any non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    // Check if it starts with 0
    if (cleanValue.startsWith('0')) {
      // If starts with 0, should be 11 digits
      if (cleanValue.length > 11) {
        return 'Mobile number starting with 0 should be 11 digits maximum';
      }
    } else {
      // If doesn't start with 0, should be 10 digits
      if (cleanValue.length > 10) {
        return 'Mobile number should be 10 digits maximum';
      }
    }
    
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mobile') {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, '');
      
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      
      // Validate mobile number
      const error = validateMobileNumber(numericValue);
      setMobileError(error);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for mobile validation errors
    if (mobileError) {
      setSubmitMessage('Please fix the mobile number errors before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact-form/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Thank you for your message! We will get back to you soon.');
        // Reset form
        setFormData({
          name: '',
          email: '',
          mobile: '',
          query: ''
        });
      } else {
        setSubmitMessage(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
      // Clear message after 5 seconds
      setTimeout(() => setSubmitMessage(''), 5000);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {contactData.heading && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{contactData.heading}</h1>
          )}
          {contactData.subheading && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {contactData.subheading}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Support Information */}
          <div className="p-6 rounded-xl shadow-xl relative overflow-hidden"
               style={{ 
                 background: `linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 80%, black) 100%)` 
               }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12 bg-white"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full translate-y-8 -translate-x-8 bg-white"></div>
            </div>
            
            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold mb-1 text-white">Support Enquiries</h2>
                <p className="text-white/70 text-sm">We're here to help you succeed</p>
              </div>

              {/* Contact Methods */}
              <div className="space-y-4">
                {/* Email */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:border-white/50 transition-all duration-300 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs font-medium">Email</p>
                      <a href={`mailto:${contactData.contactInfo.email}`} className="text-gray-900 hover:text-blue-600 transition-colors font-medium text-sm hover:underline cursor-pointer">
                        {contactData.contactInfo.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:border-white/50 transition-all duration-300 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs font-medium">Phone</p>
                      <a href={`tel:${contactData.contactInfo.phone.replace(/\s/g, '')}`} className="text-gray-900 hover:text-green-600 transition-colors font-medium text-sm hover:underline cursor-pointer">
                        {contactData.contactInfo.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:border-white/50 transition-all duration-300 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs font-medium">Business Hours</p>
                      <p className="text-gray-900 font-medium text-sm">{contactData.contactInfo.businessHours.weekdays}</p>
                      <p className="text-gray-600 text-xs">{contactData.contactInfo.businessHours.weekends}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Box */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-lg" 
                   style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))' }}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900">{contactData.supportInfo.title}</h3>
                    <p className="text-gray-700 text-sm">{contactData.supportInfo.description}</p>
                    <p className="text-gray-600 text-xs mt-1">{contactData.supportInfo.responseTime}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {/* <div className="text-center pt-2">
                <p className="text-slate-400 text-xs">
                  Can't find what you're looking for? 
                  <span className="text-white/70 font-medium ml-1">Check our FAQ section</span>
                </p>
              </div> */}
            </div>
          </div>

          {/* Right Panel - Contact Form */}
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
            <div className="space-y-4">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Connect with us</h2>
                <p className="text-gray-600 text-sm">Get in touch with us for any queries or support.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-1">
                    Your Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter your mobile number"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all duration-200 ${
                      mobileError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {mobileError && (
                    <p className="text-red-500 text-xs mt-1">{mobileError}</p>
                  )}
                </div>

                {/* Query */}
                <div>
                  <label htmlFor="query" className="block text-sm font-semibold text-gray-700 mb-1">
                    Query *
                  </label>
                  <textarea
                    id="query"
                    name="query"
                    value={formData.query}
                    onChange={handleInputChange}
                    placeholder="Describe your query or message"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent resize-none transition-all duration-200"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${themeClasses.primaryButton} w-full cursor-pointer py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Submit Enquiry'
                  )}
                </button>

                {/* Message Display */}
                {submitMessage && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    submitMessage.includes('Thank you') 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs; 