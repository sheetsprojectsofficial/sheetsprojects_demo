import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import BasicPortfolio from './BasicPortfolio';
import IntermediatePortfolio from './IntermediatePortfolio';
import PurplishPortfolio from './PurplishPortfolio';

const DynamicPortfolio = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolioTemplate();
  }, []);

  const fetchPortfolioTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/portfolio/portfolio-data`);
      const data = await response.json();

      if (data.templateType) {
        // Extract template information from the API response
        const templateName = data.templateType;
        setSelectedTemplate(templateName);
      } else {
        setSelectedTemplate('Template1_Basic');
      }
    } catch (err) {
      // Default to Basic template on error
      setSelectedTemplate('Template1_Basic');
      toast.error('Failed to load portfolio template. Using default template.', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic template mapping based on available templates from Google Sheets
  const getTemplateComponent = (templateName) => {
    // Create a dynamic mapping based on the template name
    // This allows for flexible template naming from Google Sheets
    
    if (!templateName) return BasicPortfolio;
    
    const lowerTemplateName = templateName.toLowerCase();
    
    // Map based on keywords in the template name
    if (lowerTemplateName.includes('basic') || lowerTemplateName.includes('template1')) {
      return BasicPortfolio;
    } else if (lowerTemplateName.includes('intermediate') || lowerTemplateName.includes('template2')) {
      return IntermediatePortfolio;
    } else if (lowerTemplateName.includes('purplish') || lowerTemplateName.includes('template3')) {
      return PurplishPortfolio;
    } else if (lowerTemplateName.includes('advanced') || lowerTemplateName.includes('template4')) {
      return BasicPortfolio;
    } else if (lowerTemplateName.includes('modern') || lowerTemplateName.includes('template5')) {
      return BasicPortfolio;
    } else {
      // Default fallback
      return BasicPortfolio;
    }
  };

  const renderPortfolioTemplate = () => {
    if (!selectedTemplate) {
      return <BasicPortfolio />;
    }

    const PortfolioComponent = getTemplateComponent(selectedTemplate);
    return <PortfolioComponent />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio template...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Template Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchPortfolioTemplate}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderPortfolioTemplate()}
    </div>
  );
};

export default DynamicPortfolio;
