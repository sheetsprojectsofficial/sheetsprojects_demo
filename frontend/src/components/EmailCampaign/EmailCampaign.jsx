import React, { useState } from 'react';
import CampaignList from './CampaignList';
import CreateCampaign from './CreateCampaign';
import EmailRecipients from './EmailRecipients';

const EmailCampaign = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'recipients'
  const [currentStep, setCurrentStep] = useState(1); // 1 or 2 for create/recipients
  const [editingCampaign, setEditingCampaign] = useState(null);

  const handleCreateNew = () => {
    setCurrentView('create');
    setCurrentStep(1);
    setEditingCampaign(null);
    // Clear localStorage to ensure fresh campaign creation
    localStorage.removeItem('emailCampaignDraft');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentStep(1);
    setEditingCampaign(null);
    // Clear localStorage
    localStorage.removeItem('emailCampaignDraft');
  };

  const handleNextToRecipients = () => {
    setCurrentStep(2);
    setCurrentView('recipients');
  };

  const handlePreviousToCreate = () => {
    setCurrentStep(1);
    setCurrentView('create');
  };

  const handleViewCampaign = (campaign) => {
    setEditingCampaign(campaign);

    // Load campaign data into localStorage for editing
    const campaignDraft = {
      name: campaign.name,
      docUrl: campaign.docUrl,
      docContent: campaign.docContent,
      recipients: campaign.recipients || []
    };
    localStorage.setItem('emailCampaignDraft', JSON.stringify(campaignDraft));

    setCurrentView('create');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'list' && (
        <CampaignList
          onCreateNew={handleCreateNew}
          onViewCampaign={handleViewCampaign}
        />
      )}

      {currentView === 'create' && (
        <CreateCampaign
          onNext={handleNextToRecipients}
          onCancel={handleBackToList}
          editingCampaign={editingCampaign}
        />
      )}

      {currentView === 'recipients' && (
        <EmailRecipients
          onPrevious={handlePreviousToCreate}
          onSave={handleBackToList}
          onCancel={handleBackToList}
          editingCampaign={editingCampaign}
        />
      )}
    </div>
  );
};

export default EmailCampaign;
