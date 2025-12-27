import React from 'react';
import {
  ALL_FEATURES,
  CORE_FEATURES,
  CATEGORY_ORDER,
  SELLABLE_FEATURES,
  ECOMMERCE_FEATURES
} from './tenantConfig';

const TenantFormModal = ({
  show,
  onClose,
  editingTenant,
  formData,
  setFormData,
  newDomain,
  setNewDomain,
  onSubmit
}) => {
  if (!show) return null;

  const addFrontendDomain = () => {
    if (newDomain.trim() && !formData.frontendDomains.includes(newDomain.trim())) {
      setFormData({
        ...formData,
        frontendDomains: [...formData.frontendDomains, newDomain.trim()]
      });
      setNewDomain('');
    }
  };

  const removeFrontendDomain = (domain) => {
    setFormData({
      ...formData,
      frontendDomains: formData.frontendDomains.filter(d => d !== domain)
    });
  };

  const handleFeatureChange = (featureKey, checked) => {
    let newFeatures = { ...formData.features, [featureKey]: checked };

    // If enabling a sellable feature, auto-enable e-commerce features
    if (checked && SELLABLE_FEATURES.includes(featureKey)) {
      newFeatures.orders = true;
      newFeatures.cart = true;
      newFeatures.payments = true;
    }

    setFormData({ ...formData, features: newFeatures });
  };

  // Group features by category
  const groupedFeatures = Object.entries(ALL_FEATURES).reduce((groups, [key, { label, category }]) => {
    if (!groups[category]) groups[category] = [];
    groups[category].push({ key, label });
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTenant ? 'Edit Client' : 'Add New Client'}
            </h3>
          </div>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client/Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (optional)</label>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="client.example.com"
                />
              </div>

              {/* Frontend Domains (for CORS) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frontend Domains (for CORS)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add all frontend URLs that will access this client's API (production, staging, localhost)
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFrontendDomain())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://client-site.netlify.app"
                  />
                  <button
                    type="button"
                    onClick={addFrontendDomain}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.frontendDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.frontendDomains.map((domain, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => removeFrontendDomain(domain)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Features - Grouped by Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-4">
                  {CATEGORY_ORDER
                    .filter(cat => groupedFeatures[cat])
                    .map(category => {
                      const hasSellableEnabled = SELLABLE_FEATURES.some(f => formData.features[f]);

                      return (
                        <div key={category} className="border border-gray-200 rounded-lg p-3">
                          <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            {category}
                            {category === 'Core' && <span className="ml-2 text-green-600 text-xs normal-case">(Always Enabled)</span>}
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {groupedFeatures[category].map(({ key, label }) => {
                              const isCore = CORE_FEATURES.includes(key);
                              const isAutoEcommerce = ECOMMERCE_FEATURES.includes(key) && hasSellableEnabled;

                              return (
                                <label key={key} className={`flex items-center gap-2 ${isCore || isAutoEcommerce ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={isCore || isAutoEcommerce ? true : (formData.features[key] || false)}
                                    disabled={isCore || isAutoEcommerce}
                                    onChange={(e) => !isCore && !isAutoEcommerce && handleFeatureChange(key, e.target.checked)}
                                    className={`rounded border-gray-300 ${isCore ? 'text-green-600 bg-green-50' : isAutoEcommerce ? 'text-blue-600 bg-blue-50' : 'text-blue-600'} focus:ring-blue-500`}
                                  />
                                  <span className={`text-sm ${isCore ? 'text-green-700 font-medium' : isAutoEcommerce ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {label}
                                    {isAutoEcommerce && <span className="ml-1 text-xs text-blue-500">(auto)</span>}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingTenant ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantFormModal;
