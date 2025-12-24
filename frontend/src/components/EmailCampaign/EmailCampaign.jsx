import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CampaignList from './CampaignList';
import CampaignWizard from './CampaignWizard';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const EmailCampaign = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken } = useAuth();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'wizard'
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [initialStep, setInitialStep] = useState(1);
  const [recipientSourceFilter, setRecipientSourceFilter] = useState(null); // null = show all, 'leads', 'automation'

  // Handle URL params for deep linking to specific campaign and step
  useEffect(() => {
    const campaignId = searchParams.get('campaignId');
    const step = searchParams.get('step');
    const source = searchParams.get('source'); // 'leads', 'automation', or null for all

    if (campaignId) {
      // Fetch the campaign and open it
      fetchAndOpenCampaign(campaignId, parseInt(step) || 5, source);
    }
  }, [searchParams]);

  const fetchAndOpenCampaign = async (campaignId, step, source) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/email-campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.campaign) {
        setEditingCampaign(response.data.campaign);
        setInitialStep(step);
        setRecipientSourceFilter(source || null); // Set the filter
        setCurrentView('wizard');
        // Clear the URL params after handling
        searchParams.delete('campaignId');
        searchParams.delete('step');
        searchParams.delete('source');
        setSearchParams(searchParams, { replace: true });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    }
  };

  const handleCreateNew = () => {
    setCurrentView('wizard');
    setEditingCampaign(null);
    setInitialStep(1);
    localStorage.removeItem('emailCampaignDraft');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingCampaign(null);
    setInitialStep(1);
    setRecipientSourceFilter(null); // Reset filter
    localStorage.removeItem('emailCampaignDraft');
  };

  // Edit icon - goes to Step 1
  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setInitialStep(1);
    setCurrentView('wizard');
  };

  // Campaign name click - goes to Step 5 (Preview)
  const handleViewCampaignPreview = (campaign) => {
    setEditingCampaign(campaign);
    setInitialStep(5);
    setCurrentView('wizard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'list' && (
        <CampaignList
          onCreateNew={handleCreateNew}
          onEditCampaign={handleEditCampaign}
          onViewCampaignPreview={handleViewCampaignPreview}
        />
      )}

      {currentView === 'wizard' && (
        <CampaignWizard
          onCancel={handleBackToList}
          onComplete={handleBackToList}
          editingCampaign={editingCampaign}
          initialStep={initialStep}
          recipientSourceFilter={recipientSourceFilter}
        />
      )}
    </div>
  );
};

export default EmailCampaign;
