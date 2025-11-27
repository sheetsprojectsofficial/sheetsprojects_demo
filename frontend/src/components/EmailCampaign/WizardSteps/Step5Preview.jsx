import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step5Preview = ({ campaignData, updateCampaignData, onPrevious, onComplete, editingCampaign }) => {
  const { getToken } = useAuth();
  const initialRecipients = typeof campaignData.recipients === 'string'
    ? campaignData.recipients
    : (Array.isArray(campaignData.recipients) ? campaignData.recipients.join('\n') : '');
  const [recipients, setRecipients] = useState(initialRecipients);
  const [sending, setSending] = useState(false);
  const [campaignCreated, setCampaignCreated] = useState(false);
  const [extractingEmail, setExtractingEmail] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const parseRecipients = (text) => {
    if (!text || typeof text !== 'string') {
      return [];
    }
    return text
      .split(/[\n,]+/)
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  };

  const recipientList = parseRecipients(recipients);
  const recipientCount = recipientList.length;

  // Handle visiting card image upload and OCR
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
    }

    setExtractingEmail(true);

    const allExtractedEmails = [];
    let processedCount = 0;

    for (const file of files) {
      try {
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreviewImage(base64Image);

        try {
          const response = await axios.post(`${API_BASE_URL}/email-campaigns/extract-email-from-card`, {
            image: base64Image
          });

          if (response.data.success && response.data.emails && response.data.emails.length > 0) {
            allExtractedEmails.push(...response.data.emails);
            processedCount++;
          }
        } catch (error) {
          console.error(`Error extracting email from ${file.name}:`, error);
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    setExtractingEmail(false);
    setPreviewImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (allExtractedEmails.length > 0) {
      const uniqueEmails = [...new Set(allExtractedEmails)];
      const currentRecipients = typeof recipients === 'string' ? recipients : '';
      const existingEmails = currentRecipients.trim();

      if (existingEmails) {
        setRecipients(existingEmails + '\n' + uniqueEmails.join('\n'));
      } else {
        setRecipients(uniqueEmails.join('\n'));
      }

      toast.success(`Extracted ${uniqueEmails.length} email(s) from ${processedCount} card(s)`);
    } else {
      toast.warning('No emails found in the uploaded image(s). Please try with clearer images.');
    }
  };

  const handleCreateCampaign = async () => {
    if (recipientCount === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    setSending(true);

    try {
      const token = await getToken();

      if (editingCampaign) {
        const response = await axios.put(
          `${API_BASE_URL}/email-campaigns/${editingCampaign._id}`,
          {
            name: campaignData.campaignName || campaignData.subject,
            docContent: campaignData.body,
            recipients: recipientList.map(email => ({
              name: email.split('@')[0],
              email: email,
              subject: campaignData.subject,
              sent: false
            }))
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success('Campaign updated successfully!');
          setCampaignCreated(true);

          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 2000);
        }
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/email-campaigns/create-and-send`,
          {
            name: campaignData.campaignName,
            subject: campaignData.subject,
            body: campaignData.body,
            recipients: recipientList,
            attachments: campaignData.attachments
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success(`Campaign created! Sent ${response.data.campaign.sentCount}/${response.data.campaign.totalRecipients} emails.`);
          setCampaignCreated(true);

          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error with campaign:', error);
      toast.error(error.response?.data?.message || `Failed to ${editingCampaign ? 'update' : 'create'} campaign`);
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (campaignCreated) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Campaign Created Successfully!</h2>
        <p className="text-lg text-gray-600 mb-6">
          Your campaign has been created and emails are being sent to {recipientCount} recipient(s).
        </p>
        <div className="space-y-3">
          <p className="text-gray-700">Please check your email inbox</p>
          <p className="text-gray-700">Emails may take a few minutes to arrive</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview & Send Campaign</h2>
      <p className="text-gray-600 mb-6">
        Review your campaign details and add recipients to send.
      </p>

      {/* Campaign Preview */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-lg">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Campaign Preview</h3>

        <div className="space-y-4">
          <div className="pb-4 border-b">
            <span className="text-sm font-medium text-gray-600">Campaign Name:</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">{campaignData.campaignName}</p>
          </div>

          <div className="pb-4 border-b">
            <span className="text-sm font-medium text-gray-600">Email Subject:</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">{campaignData.subject}</p>
          </div>

          <div className="pb-4 border-b">
            <span className="text-sm font-medium text-gray-600 block mb-2">Body:</span>
            <div
              className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: campaignData.body }}
            />
          </div>

          {campaignData.attachments && campaignData.attachments.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600 block mb-2">
                Attachments ({campaignData.attachments.length}):
              </span>
              <div className="space-y-2">
                {campaignData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="flex-1">{file.name}</span>
                    <span className="text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-600">From:</span>
            <p className="text-gray-900 mt-1">{campaignData.emailConfig?.email}</p>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Recipients <span className="text-red-500">*</span>
          </label>

          {/* Visiting Card Upload Button */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
              id="visiting-card-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extractingEmail}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {extractingEmail ? 'Extracting...' : 'Scan Visiting Cards'}
            </button>
          </div>
        </div>

        {/* Image Preview during extraction */}
        {previewImage && extractingEmail && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={previewImage}
                alt="Visiting card preview"
                className="w-32 h-20 object-cover rounded-lg border"
              />
              <div className="flex items-center gap-2 text-purple-700">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span className="font-medium">Extracting email from visiting card using AI...</span>
              </div>
            </div>
          </div>
        )}

        {/* Helper text */}
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can select multiple visiting card images at once to extract emails in bulk.
          </p>
        </div>

        <textarea
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="Enter recipient emails (comma or newline separated)&#10;Example:&#10;john@example.com, jane@example.com&#10;bob@example.com"
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {recipientCount} valid email(s) found
          </p>
          <p className="text-sm text-green-600 font-medium">
            Unlimited emails available
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
          disabled={sending}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Previous
        </button>
        <button
          onClick={handleCreateCampaign}
          disabled={sending || recipientCount === 0}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {editingCampaign ? 'Updating...' : 'Creating & Sending...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingCampaign ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"} />
              </svg>
              {editingCampaign ? 'Update Campaign' : 'Create & Send Campaign'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step5Preview;
