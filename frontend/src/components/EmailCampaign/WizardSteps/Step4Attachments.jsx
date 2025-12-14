import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step4Attachments = ({ campaignData, updateCampaignData, onNext, onPrevious }) => {
  const [attachments, setAttachments] = useState(campaignData.attachments || []);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const getFileNameFromUrl = async (url) => {
    // Check if it's a Google Drive or Google Docs URL - fetch from backend
    const isGoogleUrl = url.includes('drive.google.com') || url.includes('docs.google.com');

    if (isGoogleUrl) {
      try {
        const response = await axios.post(`${API_BASE_URL}/email-campaigns/fetch-file-name`, { url });
        if (response.data.success && response.data.fileName) {
          return response.data.fileName;
        }
      } catch (error) {
        console.log('Could not fetch file name from backend:', error);
      }
    }

    // Fallback: Extract filename from URL pathname
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

      // If filename is generic like "edit", "view", "preview", use "Document"
      const genericNames = ['edit', 'view', 'preview', 'sharing', 'export'];
      if (!filename || genericNames.includes(filename.toLowerCase()) || filename.length < 3) {
        return 'Document';
      }

      return decodeURIComponent(filename);
    } catch {
      return 'Document';
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim()) {
      toast.error('Please enter a file URL');
      return;
    }

    if (!validateUrl(attachmentUrl)) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    if (attachments.length >= 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }

    setIsLoading(true);
    try {
      const fileName = await getFileNameFromUrl(attachmentUrl);
      const newAttachment = {
        url: attachmentUrl,
        name: fileName,
        type: 'url'
      };

      setAttachments(prev => [...prev, newAttachment]);
      setAttachmentUrl('');
    } catch (error) {
      console.error('Error adding attachment:', error);
      toast.error('Failed to add attachment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewAttachment = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNext = () => {
    updateCampaignData({ attachments });
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Attachments (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Add file links to attach to your email campaign. You can add up to 5 file links.
      </p>

      {/* URL Input Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File URL (PDF, DOC, or Google Drive link)
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAttachment();
              }
            }}
            placeholder="https://example.com/file.pdf or https://drive.google.com/..."
            disabled={attachments.length >= 5}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleAddAttachment}
            disabled={attachments.length >= 5 || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: PDF, DOC, DOCX files or Google Drive links containing PDF/DOC files
        </p>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Attached Files ({attachments.length}/5)
          </h3>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500 truncate">{file.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() => handleViewAttachment(file.url)}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    title="View attachment in new tab"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove attachment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tips:</strong> Use direct file links (PDF/DOC) or Google Drive sharing links. Make sure the file is publicly accessible or has proper sharing permissions. Attachments are optional.
        </p>
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
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Next: Preview & Send
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Step4Attachments;
