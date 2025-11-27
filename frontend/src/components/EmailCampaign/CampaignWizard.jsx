import React, { useState, useEffect } from 'react';
import Step1Content from './WizardSteps/Step1Content';
import Step2EmailConfig from './WizardSteps/Step2EmailConfig';
import Step3TestEmail from './WizardSteps/Step3TestEmail';
import Step4Attachments from './WizardSteps/Step4Attachments';
import Step5Preview from './WizardSteps/Step5Preview';

const CampaignWizard = ({ onCancel, onComplete, editingCampaign, initialStep = 1 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Campaign data state
  const [campaignData, setCampaignData] = useState({
    campaignName: '',
    subject: '',
    body: '',
    emailConfig: {
      email: '',
      appPassword: ''
    },
    testEmail: '',
    testEmailSent: false,
    attachments: [],
    recipients: []
  });

  // On mount, load editing campaign data if available
  useEffect(() => {
    if (editingCampaign) {
      console.log('Loading campaign for editing:', editingCampaign);
      const recipientEmails = editingCampaign.recipients?.map(r => r.email).join('\n') || '';

      setCampaignData({
        campaignName: editingCampaign.name || '',
        subject: editingCampaign.recipients?.[0]?.subject || editingCampaign.name || '',
        body: editingCampaign.docContent || '',
        emailConfig: {
          email: '',
          appPassword: ''
        },
        testEmail: '',
        testEmailSent: false,
        attachments: [],
        recipients: recipientEmails
      });

      setCurrentStep(initialStep);
    } else {
      // Generate default name for new campaigns
      const defaultName = `Campaign ${new Date().toLocaleDateString()}`;
      setCampaignData(prev => ({ ...prev, campaignName: defaultName }));
      setCurrentStep(initialStep);
      sessionStorage.removeItem('wizardCurrentStep');
    }
  }, [editingCampaign, initialStep]);

  const steps = [
    { number: 1, title: 'Content', description: 'What to write?' },
    { number: 2, title: 'Email Config', description: 'Configure email' },
    { number: 3, title: 'Test', description: campaignData.testEmailSent ? 'Test sent' : 'Test email' },
    { number: 4, title: 'Attachments', description: 'Add files (optional)' },
    { number: 5, title: 'Preview', description: 'Review & send' }
  ];

  const handleNext = () => {
    // If test email was sent, skip step 3
    if (campaignData.testEmailSent && currentStep === 2) {
      setCurrentStep(4);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (campaignData.testEmailSent && currentStep === 4) {
      setCurrentStep(2);
    } else if (campaignData.testEmailSent && currentStep === 5) {
      setCurrentStep(4);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateCampaignData = (data) => {
    setCampaignData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {editingCampaign ? (
                  <span>Editing: {editingCampaign.name}</span>
                ) : (
                  <span className="text-green-600 font-medium">Unlimited emails available</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 transition-all ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${currentStep === step.number ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {currentStep === 1 && (
            <Step1Content
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              editingCampaign={editingCampaign}
            />
          )}

          {currentStep === 2 && (
            <Step2EmailConfig
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}

          {currentStep === 3 && (
            <Step3TestEmail
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}

          {currentStep === 4 && (
            <Step4Attachments
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}

          {currentStep === 5 && (
            <Step5Preview
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onPrevious={handlePrevious}
              onComplete={onComplete}
              editingCampaign={editingCampaign}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Check our documentation or contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;
