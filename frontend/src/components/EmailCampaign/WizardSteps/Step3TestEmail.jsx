import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step3TestEmail = ({ campaignData, updateCampaignData, onNext, onPrevious }) => {
  const { user, getToken } = useAuth();
  const [testEmail, setTestEmail] = useState(campaignData.testEmail || user?.email || '');
  const [sending, setSending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/email-campaigns/send-test`,
        {
          to: testEmail,
          subject: campaignData.subject,
          body: campaignData.body
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Test email sent successfully!');
        setTestSent(true);
        updateCampaignData({ testEmail, testEmailSent: true });

        setTimeout(() => {
          onNext();
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const handleSkipAndNext = () => {
    updateCampaignData({ testEmail });
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Your Email</h2>
      <p className="text-gray-600 mb-6">
        Send a test email to yourself to see how it will look for recipients.
      </p>

      {/* Preview Card */}
      <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4">Email Preview</h3>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Subject:</span>
            <p className="text-gray-900 mt-1">{campaignData.subject || 'No subject'}</p>
          </div>

          <div className="border-t pt-3">
            <span className="text-sm font-medium text-gray-600 block mb-2">Body:</span>
            <div
              className="text-gray-900 max-h-48 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: campaignData.body || 'No content' }}
            />
          </div>
        </div>
      </div>

      {/* Test Email Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send test email to <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your.email@gmail.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500">
            We recommend testing with your own email address first
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={sending || !testEmail}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? 'Sending...' : 'Send Test Email'}
        </button>

        {testSent && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900">Test email sent!</h4>
            <p className="text-sm text-green-800 mt-1">
              Check your inbox at {testEmail}. Moving to next step...
            </p>
          </div>
        )}
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
        <div className="flex gap-3">
          <button
            onClick={handleSkipAndNext}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Skip Test
          </button>
          <button
            onClick={onNext}
            disabled={!testSent}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next: Attachments
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3TestEmail;
