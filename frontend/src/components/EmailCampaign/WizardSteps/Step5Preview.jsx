import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step5Preview = ({ campaignData, updateCampaignData, onPrevious, onComplete, editingCampaign, recipientSourceFilter = null }) => {
  const { getToken } = useAuth();

  // Active filter state - can be changed by user via tabs
  const [activeFilter, setActiveFilter] = useState(recipientSourceFilter);

  // Handle different recipient formats: string, array of strings, or array of objects
  const getRecipientsFromData = (data, filter = null) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      // Check if it's an array of objects or strings
      if (data.length > 0 && typeof data[0] === 'object' && data[0].email) {
        // Array of recipient objects - filter by source if filter is provided
        let filtered = data;
        if (filter) {
          if (filter === 'manual') {
            // Manual includes recipients with source='manual' OR no source set (legacy data)
            filtered = data.filter(r => r.source === 'manual' || !r.source);
          } else {
            filtered = data.filter(r => r.source === filter);
          }
        }
        return filtered.map(r => r.email).filter(Boolean).join('\n');
      }
      // Array of strings
      return data.filter(Boolean).join('\n');
    }
    return '';
  };

  // Get counts for each source
  const getSourceCounts = () => {
    const recipients = editingCampaign?.recipients || [];
    return {
      all: recipients.length,
      manual: recipients.filter(r => r.source === 'manual' || !r.source).length,
      leads: recipients.filter(r => r.source === 'leads').length,
      automation: recipients.filter(r => r.source === 'automation').length,
    };
  };

  const sourceCounts = getSourceCounts();

  const [recipients, setRecipients] = useState('');

  // Load recipients whenever filter changes or on initial load
  useEffect(() => {
    // Priority 1: Check editingCampaign.recipients directly (for campaigns loaded from DB)
    if (editingCampaign?.recipients && editingCampaign.recipients.length > 0) {
      const recipientEmails = getRecipientsFromData(editingCampaign.recipients, activeFilter);
      setRecipients(recipientEmails);
      return;
    }

    // Priority 2: Check campaignData.recipients
    if (campaignData.recipients) {
      const recipientEmails = getRecipientsFromData(campaignData.recipients, activeFilter);
      setRecipients(recipientEmails);
    }
  }, [editingCampaign, activeFilter]); // Re-run when filter changes

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
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
    let crmStoredCount = 0;
    let duplicateCount = 0;

    // Get auth token for CRM storage
    const token = await getToken();

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
          // Call the new CRM extraction endpoint that extracts all data and stores it
          const response = await axios.post(
            `${API_BASE_URL}/email-campaigns/extract-and-store-crm`,
            {
              image: base64Image
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success && response.data.emails && response.data.emails.length > 0) {
            allExtractedEmails.push(...response.data.emails);
            processedCount++;

            // Track CRM storage status
            if (response.data.crmData) {
              if (response.data.isDuplicate) {
                duplicateCount++;
              } else {
                crmStoredCount++;
              }
            }
          }
        } catch (error) {
          console.error(`Error extracting data from ${file.name}:`, error);
          toast.error(error.response?.data?.message || `Failed to process ${file.name}`);
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        toast.error(`Failed to read ${file.name}`);
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

      // Show comprehensive success message
      let successMessage = `Extracted ${uniqueEmails.length} email(s) from ${processedCount} card(s).`;
      if (crmStoredCount > 0) {
        successMessage += ` ${crmStoredCount} new contact(s) saved to CRM.`;
      }
      if (duplicateCount > 0) {
        successMessage += ` ${duplicateCount} duplicate(s) updated.`;
      }

      toast.success(successMessage);
    } else {
      toast.warning('No emails found in the uploaded image(s). Please try with clearer images.');
    }
  };

  const handleUpdateCampaign = async () => {
    if (recipientCount === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    setSending(true);

    try {
      const token = await getToken();
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
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    } finally {
      setSending(false);
    }
  };

  const handleSendEmails = async () => {
    if (recipientCount === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    setSending(true);

    try {
      const token = await getToken();

      // First update the campaign with attachments
      await axios.put(
        `${API_BASE_URL}/email-campaigns/${editingCampaign._id}`,
        {
          name: campaignData.campaignName || campaignData.subject,
          docContent: campaignData.body,
          recipients: recipientList.map(email => ({
            name: email.split('@')[0],
            email: email,
            subject: campaignData.subject,
            sent: false
          })),
          attachments: campaignData.attachments || []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then send emails from existing campaign (not create-and-send)
      const response = await axios.post(
        `${API_BASE_URL}/email-campaigns/send-from-campaign`,
        {
          campaignId: editingCampaign._id,
          recipients: recipientList,
          subject: campaignData.subject,
          body: campaignData.body,
          attachments: campaignData.attachments
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Emails sent! ${response.data.campaign.sentCount}/${response.data.campaign.totalRecipients} delivered.`);
        setCampaignCreated(true);

        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
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
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
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
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {editingCampaign ? 'Emails Sent Successfully!' : 'Campaign Created Successfully!'}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {editingCampaign
            ? `Emails have been sent to ${recipientCount} recipient(s).`
            : `Your campaign has been created and emails are being sent to ${recipientCount} recipient(s).`
          }
        </p>
        <div className="space-y-3">
          <p className="text-gray-700">Emails may take a few minutes to arrive</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Campaign</h2>
      <p className="text-gray-600 mb-4">
        Add recipients to send your campaign.
      </p>

      {/* Source Filter Tabs - Only show when editing a campaign */}
      {editingCampaign && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Filter recipients by source:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeFilter === null
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({sourceCounts.all})
            </button>
            <button
              onClick={() => handleFilterChange('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeFilter === 'manual'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Manual ({sourceCounts.manual})
              </span>
            </button>
            <button
              onClick={() => handleFilterChange('leads')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeFilter === 'leads'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                From Leads ({sourceCounts.leads})
              </span>
            </button>
            <button
              onClick={() => handleFilterChange('automation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeFilter === 'automation'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                From Automation ({sourceCounts.automation})
              </span>
            </button>
          </div>
          {activeFilter && (
            <p className="mt-2 text-sm text-blue-600">
              Showing only {activeFilter === 'manual' ? 'manually added' : activeFilter === 'leads' ? 'leads' : 'automation'} recipients.
              <button
                onClick={() => handleFilterChange(null)}
                className="ml-1 underline cursor-pointer hover:text-blue-800"
              >
                Show all
              </button>
            </p>
          )}
        </div>
      )}

      {/* Recipients */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Recipients <span className="text-red-500">*</span>
          </label>

          {/* Visiting Card Upload Button - Only show on All or Manual tabs */}
          {(activeFilter === null || activeFilter === 'manual') && (
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-purple-600 font-medium">Upload only front side</p>
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
          )}
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

        {editingCampaign ? (
          <div className="flex gap-3">
            <button
              onClick={handleUpdateCampaign}
              disabled={sending || recipientCount === 0}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Campaign
                </>
              )}
            </button>
            <button
              onClick={handleSendEmails}
              disabled={sending || recipientCount === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreateCampaign}
            disabled={sending || recipientCount === 0}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating & Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Create & Send Campaign
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Step5Preview;
