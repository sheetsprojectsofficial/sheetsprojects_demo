import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step2EmailConfig = ({ campaignData, updateCampaignData, onNext, onPrevious }) => {
  const { getToken } = useAuth();
  const [email, setEmail] = useState(campaignData.emailConfig?.email || '');
  const [appPassword, setAppPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  useEffect(() => {
    fetchExistingConfig();
  }, []);

  const fetchExistingConfig = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/email-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.config) {
        const { fromEmail, hasPassword } = response.data.config;
        setSavedEmail(fromEmail);
        setEmail(maskEmail(fromEmail));
        setHasExistingConfig(true);

        // Just mark that email is configured - backend uses saved config
        if (hasPassword) {
          updateCampaignData({
            emailConfig: {
              email: fromEmail,
              configured: true
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleChangeEmail = () => {
    setIsEditingEmail(true);
    setEmail('');
    setAppPassword('');
  };

  const handleTestConnection = async () => {
    if (hasExistingConfig && !isEditingEmail && !appPassword) {
      toast.error('Please enter app password to test connection');
      return;
    }

    const emailToUse = hasExistingConfig && !isEditingEmail && email.includes('*') ? savedEmail : email;

    if (!emailToUse || !appPassword) {
      toast.error('Please enter both email and app password');
      return;
    }

    setTesting(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/email-config/test`,
        { fromEmail: emailToUse, appPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Email configuration is valid!');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error(error.response?.data?.message || 'Failed to test email configuration');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndNext = async () => {
    const emailToUse = hasExistingConfig && !isEditingEmail && email.includes('*') ? savedEmail : email;

    if (hasExistingConfig && !isEditingEmail && !appPassword) {
      onNext();
      return;
    }

    if (!emailToUse || !appPassword) {
      toast.error('Please enter both email and app password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/email-config`,
        { fromEmail: emailToUse, appPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateCampaignData({ emailConfig: { email: emailToUse, appPassword } });
      onNext();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save email configuration');
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Email Settings</h2>
      <p className="text-gray-600 mb-6">
        Currently we are using our own Gmail, but later on you have to change it to yours for sending emails.
      </p>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gmail Address <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={hasExistingConfig && !isEditingEmail && email.includes('*')}
            />
            {hasExistingConfig && !isEditingEmail && email.includes('*') && (
              <button
                type="button"
                onClick={handleChangeEmail}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Change Email
              </button>
            )}
          </div>
          {hasExistingConfig && !isEditingEmail && email.includes('*') && (
            <p className="mt-2 text-xs text-gray-500">
              Using saved email configuration. Click "Change Email" to use a different account.
            </p>
          )}
          {isEditingEmail && (
            <p className="mt-2 text-xs text-blue-600">
              Enter your new Gmail address and app password below.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Password {hasExistingConfig && !isEditingEmail ? <span className="text-gray-500">(optional - already saved)</span> : <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder={hasExistingConfig ? "Leave empty to use saved" : "16-character app password"}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="new-password"
          />
        </div>

        {/* Instructions Card */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to get Gmail App Password:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to your Google Account settings</li>
            <li>Select Security - 2-Step Verification (enable if not already)</li>
            <li>Select App Passwords</li>
            <li>Generate a new app password for "Mail"</li>
            <li>Copy the 16-character password and paste it below</li>
          </ol>
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Open App Password Settings
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing || !email || !appPassword}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Previous
        </button>
        <button
          onClick={handleSaveAndNext}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Next: Test Email
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Step2EmailConfig;
