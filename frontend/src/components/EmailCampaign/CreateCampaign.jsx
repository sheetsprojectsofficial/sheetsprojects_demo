import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './EmailCampaign.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const CreateCampaign = ({ onNext, onCancel, editingCampaign }) => {
  const [campaignName, setCampaignName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docContent, setDocContent] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [nextCampaignNumber, setNextCampaignNumber] = useState(0);

  useEffect(() => {
    // Check if we have a draft in localStorage
    const draft = localStorage.getItem('emailCampaignDraft');
    if (draft && !editingCampaign) {
      const parsed = JSON.parse(draft);
      setCampaignName(parsed.name || '');
      setDocUrl(parsed.docUrl || '');
      setDocContent(parsed.docContent || '');
    } else if (editingCampaign) {
      setCampaignName(editingCampaign.name || '');
      setDocUrl(editingCampaign.docUrl || '');
      setDocContent(editingCampaign.docContent || '');
    } else {
      // Fetch next campaign number
      fetchNextCampaignNumber();
    }
  }, [editingCampaign]);

  const fetchNextCampaignNumber = async () => {
    try {
      // This will check the database for existing campaigns
      const response = await axios.get(`${API_BASE_URL}/email-campaigns/next-number`);
      if (response.data.success) {
        const nextNum = response.data.nextNumber;
        setNextCampaignNumber(nextNum);
        setCampaignName(`Untitled${nextNum} Campaign`);
      }
    } catch (error) {
      // If API fails, default to 0
      setCampaignName('Untitled0 Campaign');
      setNextCampaignNumber(0);
    }
  };

  const handleFetchDocContent = async () => {
    if (!docUrl.trim()) {
      toast.error('Please enter a Google Doc URL');
      return;
    }

    // Validate Google Docs URL
    if (!docUrl.includes('docs.google.com')) {
      toast.error('Please enter a valid Google Docs URL');
      return;
    }

    setLoadingDoc(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/email-campaigns/fetch-doc`, {
        docUrl: docUrl.trim()
      });

      if (response.data.success) {
        setDocContent(response.data.content);
        toast.success('Document content loaded successfully!');
      } else {
        toast.error(response.data.error || 'Failed to fetch document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch document content');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleNext = () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!docUrl.trim()) {
      toast.error('Please enter a document URL');
      return;
    }

    if (!docContent.trim()) {
      toast.error('Please fetch the document content first');
      return;
    }

    // Save to localStorage, preserving existing recipients if any
    const existingDraft = localStorage.getItem('emailCampaignDraft');
    let recipients = [];

    if (existingDraft) {
      const parsed = JSON.parse(existingDraft);
      recipients = parsed.recipients || [];
    }

    const draft = {
      name: campaignName,
      docUrl: docUrl,
      docContent: docContent,
      recipients: recipients
    };
    localStorage.setItem('emailCampaignDraft', JSON.stringify(draft));

    onNext();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Back to campaigns"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
            <p className="text-sm text-gray-600">Step 1 of 2: Campaign Details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Campaign Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Enter campaign name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="mt-1 text-sm text-gray-500">
            Default naming: Untitled0 Campaign, Untitled1 Campaign, etc.
          </p>
        </div>

        {/* Document URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Doc URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleFetchDocContent}
              disabled={loadingDoc || !docUrl.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {loadingDoc ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Fetch Content
                </>
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter the URL of the Google Doc containing your email template
          </p>
        </div>

        {/* Document Preview */}
        {docContent && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Template Preview
              </label>
              {docUrl && (
                <button
                  onClick={() => window.open(docUrl, '_blank')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="View original document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View in Google Docs
                </button>
              )}
            </div>
            <div className="border border-gray-300 rounded-lg p-8 bg-white max-h-96 overflow-y-auto">
              <div
                className="email-content"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#333'
                }}
                dangerouslySetInnerHTML={{ __html: docContent }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This content will be sent as the email body to all recipients
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            disabled
            className="px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
