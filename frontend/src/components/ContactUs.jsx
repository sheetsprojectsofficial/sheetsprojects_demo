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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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

  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  const validateMobileNumber = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.startsWith('0')) {
      if (cleanValue.length > 11) {
        return 'Mobile number starting with 0 should be 11 digits maximum';
      }
    } else {
      if (cleanValue.length > 10) {
        return 'Mobile number should be 10 digits maximum';
      }
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      const error = validateMobileNumber(numericValue);
      setMobileError(error);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mobileError) {
      setSubmitMessage('Please fix the mobile number errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact-form/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', mobile: '', query: '' });
      } else {
        setSubmitMessage(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(''), 5000);
    }
  };

  return (
    <section className="relative py-5 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 mb-6">
            <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Get in Touch</span>
          </div>

          {contactData.heading && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {contactData.heading}
            </h2>
          )}
          {contactData.subheading && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {contactData.subheading}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Panel - Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email Card */}
              <div className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-1">Email Us</h3>
                    <a href={`mailto:${contactData.contactInfo.email}`} className="text-brand-primary hover:underline text-sm">
                      {contactData.contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-1">Call Us</h3>
                    <a href={`tel:${contactData.contactInfo.phone?.replace(/\s/g, '')}`} className="text-brand-primary hover:underline text-sm">
                      {contactData.contactInfo.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-600 text-sm">{contactData.contactInfo.businessHours.weekdays}</p>
                    <p className="text-gray-500 text-xs mt-1">{contactData.contactInfo.businessHours.weekends}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Info */}
            {contactData.supportInfo.title && (
              <div className="rounded-2xl p-6 border border-gray-200" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.05)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-2">{contactData.supportInfo.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{contactData.supportInfo.description}</p>
                    <p className="text-brand-primary text-xs font-medium">{contactData.supportInfo.responseTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 rounded-3xl p-8 lg:p-10 border border-gray-100">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h3>
                <p className="text-gray-600 text-sm">Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter your mobile number"
                    required
                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                      mobileError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {mobileError && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {mobileError}
                    </p>
                  )}
                </div>

                {/* Query */}
                <div>
                  <label htmlFor="query" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="query"
                    name="query"
                    value={formData.query}
                    onChange={handleInputChange}
                    placeholder="Tell us about your project or ask us anything..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${themeClasses.primaryButton} w-full cursor-pointer py-4 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Message Display */}
                {submitMessage && (
                  <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
                    submitMessage.includes('Thank you')
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${submitMessage.includes('Thank you') ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {submitMessage.includes('Thank you') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
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
