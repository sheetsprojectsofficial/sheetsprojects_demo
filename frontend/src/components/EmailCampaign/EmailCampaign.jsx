import React, { useState } from 'react';
import CampaignList from './CampaignList';
import CampaignWizard from './CampaignWizard';

const EmailCampaign = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'wizard'
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [initialStep, setInitialStep] = useState(1);

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
        />
      )}
    </div>
  );
};

export default EmailCampaign;
