import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step3TestEmail = ({ campaignData, updateCampaignData, onNext, onPrevious, editingCampaign }) => {
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

        // For new campaigns, save the campaign after successful test
        if (!editingCampaign) {
          try {
            const saveResponse = await axios.post(
              `${API_BASE_URL}/email-campaigns`,
              {
                name: campaignData.campaignName,
                docContent: campaignData.body,
                recipients: [{
                  name: 'Draft',
                  email: testEmail,
                  subject: campaignData.subject,
                  sent: false
                }]
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (saveResponse.data.success) {
              toast.success('Campaign saved successfully!');
            }
          } catch (saveError) {
            console.error('Error saving campaign:', saveError);
            toast.warning('Test sent but failed to save campaign');
          }
        }

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

  const handleSkipAndNext = async () => {
    // For new campaigns, save the campaign before completing
    if (!editingCampaign) {
      if (!campaignData.campaignName || !campaignData.subject || !campaignData.body) {
        toast.error('Please complete all required fields');
        return;
      }

      setSending(true);
      try {
        const token = await getToken();
        const response = await axios.post(
          `${API_BASE_URL}/email-campaigns`,
          {
            name: campaignData.campaignName,
            docContent: campaignData.body,
            recipients: [{
              name: 'Draft',
              email: testEmail || user?.email || 'draft@example.com',
              subject: campaignData.subject,
              sent: false
            }]
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success('Campaign saved successfully!');
          updateCampaignData({ testEmail, testEmailSent: true });
          setTimeout(() => {
            onNext();
          }, 1000);
        }
      } catch (error) {
        console.error('Error saving campaign:', error);
        toast.error(error.response?.data?.error || 'Failed to save campaign');
      } finally {
        setSending(false);
      }
    } else {
      updateCampaignData({ testEmail, testEmailSent: true });
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Your Email</h2>
      <p className="text-gray-600 mb-4">
        Send a test email to yourself to see how it will look for recipients.
      </p>

      {/* Test Email Form */}
      <div className="space-y-4">
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
      <div className="flex justify-between items-center mt-6">
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
            disabled={sending}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Saving...' : (editingCampaign ? 'Skip Test' : 'Skip & Complete')}
          </button>
          <button
            onClick={onNext}
            disabled={!testSent || sending}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {editingCampaign ? 'Next: Attachments' : 'Complete'}
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
