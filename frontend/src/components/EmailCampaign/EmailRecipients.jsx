import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const EmailRecipients = ({ onPrevious, onSave, onCancel, editingCampaign }) => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', subject: '' });
  const [saving, setSaving] = useState(false);
  const [sendingEmails, setSendingEmails] = useState({}); // Track which emails are being sent
  const [campaignId, setCampaignId] = useState(null); // Store campaign ID after saving

  useEffect(() => {
    // Load recipients from localStorage if available
    const draft = localStorage.getItem('emailCampaignDraft');
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.recipients && parsed.recipients.length > 0) {
        setRecipients(parsed.recipients);
      }
    }

    // Set campaign ID if editing
    if (editingCampaign && editingCampaign._id) {
      setCampaignId(editingCampaign._id);
    }
  }, [editingCampaign]);

  useEffect(() => {
    // Save recipients to localStorage whenever they change
    if (recipients.length >= 0) {
      const draft = localStorage.getItem('emailCampaignDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        parsed.recipients = recipients;
        localStorage.setItem('emailCampaignDraft', JSON.stringify(parsed));
      } else {
        // Create a new draft if it doesn't exist
        const newDraft = {
          name: '',
          docUrl: '',
          docContent: '',
          recipients: recipients
        };
        localStorage.setItem('emailCampaignDraft', JSON.stringify(newDraft));
      }
    }
  }, [recipients]);

  const handleAdd = async () => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.subject.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const updatedRecipients = [...recipients, { ...editForm, sent: false }];
    setRecipients(updatedRecipients);
    setEditForm({ name: '', email: '', subject: '' });
    toast.success('Recipient added successfully');

    // If campaign is already saved, update it in the database
    if (campaignId) {
      try {
        const token = await user.getIdToken();
        const draft = localStorage.getItem('emailCampaignDraft');
        const campaignData = draft ? JSON.parse(draft) : {};

        await axios.put(
          `${API_BASE_URL}/email-campaigns/${campaignId}`,
          {
            ...campaignData,
            recipients: updatedRecipients
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('Error updating campaign in database:', error);
        toast.error('Added locally but failed to sync with database');
      }
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...recipients[index] });
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.subject.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const updatedRecipients = [...recipients];
    updatedRecipients[editingIndex] = { ...editForm };
    setRecipients(updatedRecipients);
    setEditingIndex(null);
    setEditForm({ name: '', email: '', subject: '' });
    toast.success('Recipient updated successfully');

    // If campaign is already saved, update it in the database
    if (campaignId) {
      try {
        const token = await user.getIdToken();
        const draft = localStorage.getItem('emailCampaignDraft');
        const campaignData = draft ? JSON.parse(draft) : {};

        await axios.put(
          `${API_BASE_URL}/email-campaigns/${campaignId}`,
          {
            ...campaignData,
            recipients: updatedRecipients
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('Error updating campaign in database:', error);
        toast.error('Updated locally but failed to sync with database');
      }
    }
  };

  const handleDelete = async (index) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      const updatedRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(updatedRecipients);
      toast.success('Recipient deleted successfully');

      // If campaign is already saved, update it in the database
      if (campaignId) {
        try {
          const token = await user.getIdToken();
          const draft = localStorage.getItem('emailCampaignDraft');
          const campaignData = draft ? JSON.parse(draft) : {};

          await axios.put(
            `${API_BASE_URL}/email-campaigns/${campaignId}`,
            {
              ...campaignData,
              recipients: updatedRecipients
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (error) {
          console.error('Error updating campaign in database:', error);
          toast.error('Deleted locally but failed to sync with database');
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ name: '', email: '', subject: '' });
  };

  const handleSaveCampaign = async () => {
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    const draft = localStorage.getItem('emailCampaignDraft');
    if (!draft) {
      toast.error('Campaign data not found. Please start over.');
      return;
    }

    const campaignData = JSON.parse(draft);
    campaignData.recipients = recipients;

    setSaving(true);
    try {
      const token = await user.getIdToken();

      let response;

      // Check if we're editing an existing campaign or creating a new one
      if (editingCampaign && editingCampaign._id) {
        // UPDATE existing campaign
        response = await axios.put(
          `${API_BASE_URL}/email-campaigns/${editingCampaign._id}`,
          campaignData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // CREATE new campaign
        response = await axios.post(
          `${API_BASE_URL}/email-campaigns`,
          campaignData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.success) {
        toast.success(editingCampaign ? 'Campaign updated successfully!' : 'Campaign saved successfully!');

        // Store campaign ID for sending emails
        if (response.data.campaign && response.data.campaign._id) {
          setCampaignId(response.data.campaign._id);
        }

        // Update recipients with the saved data (including sent status)
        if (response.data.campaign && response.data.campaign.recipients) {
          setRecipients(response.data.campaign.recipients);
        }

        // Clear localStorage
        localStorage.removeItem('emailCampaignDraft');

        // Don't navigate away - stay on page to send emails
        // onSave();
      } else {
        toast.error(response.data.error || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error(error.response?.data?.error || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (recipientEmail, index) => {
    if (!campaignId) {
      toast.error('Please save the campaign first before sending emails');
      return;
    }

    setSendingEmails(prev => ({ ...prev, [recipientEmail]: true }));

    try {
      const token = await user.getIdToken();

      const response = await axios.post(
        `${API_BASE_URL}/email-campaigns/send-email`,
        {
          campaignId: campaignId,
          recipientEmail: recipientEmail
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Email sent successfully to ${recipientEmail}`);

        // Update recipient status in local state
        const updatedRecipients = [...recipients];
        updatedRecipients[index] = {
          ...updatedRecipients[index],
          sent: true,
          sentAt: new Date()
        };
        setRecipients(updatedRecipients);
      } else {
        toast.error(response.data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setSendingEmails(prev => ({ ...prev, [recipientEmail]: false }));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Back to campaign details"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingCampaign ? 'Edit Campaign - Recipients' : 'Email Recipients'}
            </h1>
            <p className="text-sm text-gray-600">Step 2 of 2: Add and manage recipients</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingIndex !== null ? 'Edit Recipient' : 'Add New Recipient'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
            <input
              type="text"
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              placeholder="Your Website Opportunity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingIndex !== null ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Recipient
            </button>
          )}
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recipients List ({recipients.length})
            </h2>
            {!campaignId && recipients.length > 0 && (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                Save campaign first to send emails
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No recipients added yet. Use the form above to add recipients.
                  </td>
                </tr>
              ) : (
                recipients.map((recipient, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{recipient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{recipient.subject || recipient.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        {recipient.sent ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Sent
                          </span>
                        ) : (
                          <>
                            {campaignId ? (
                              <button
                                onClick={() => handleSendEmail(recipient.email, index)}
                                disabled={sendingEmails[recipient.email]}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                title="Send Email"
                              >
                                {sendingEmails[recipient.email] ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send
                                  </>
                                )}
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleEdit(index)}
                              className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        {campaignId ? (
          <button
            onClick={onSave}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Campaigns
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <div className="flex gap-3">
          {!campaignId && (
            <button
              onClick={onPrevious}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous
            </button>
          )}
          {!campaignId && (
            <button
              onClick={handleSaveCampaign}
              disabled={saving || recipients.length === 0}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingCampaign ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingCampaign ? 'Save Changes' : 'Save Campaign'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailRecipients;
