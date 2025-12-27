import React from 'react';
import { isMaskedValue } from './tenantConfig';

const CredentialInput = ({ placeholder, value, section, field, onChange, onFocus }) => {
  const masked = isMaskedValue(value);
  const hasValue = Boolean(value);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onFocus={(e) => onFocus(e, section, field)}
      onChange={(e) => onChange(section, field, e.target.value)}
      className={`w-full px-3 py-2 border rounded-lg text-sm ${
        masked ? 'border-green-300 bg-green-50 text-green-700' :
        hasValue ? 'border-blue-300 bg-blue-50' :
        'border-gray-300'
      }`}
    />
  );
};

const CredentialTextarea = ({ placeholder, value, section, field, onChange, onFocus }) => {
  const masked = isMaskedValue(value);
  const hasValue = Boolean(value);

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onFocus={(e) => onFocus(e, section, field)}
      onChange={(e) => onChange(section, field, e.target.value)}
      className={`w-full px-3 py-2 border rounded-lg text-sm h-20 ${
        masked ? 'border-green-300 bg-green-50 text-green-700' :
        hasValue ? 'border-blue-300 bg-blue-50' :
        'border-gray-300'
      }`}
    />
  );
};

const CredentialSection = ({ title, configured, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">
      {title}
      {configured && (
        <span className="ml-2 text-xs text-green-600 font-normal">✓ Configured</span>
      )}
    </h4>
    {children}
  </div>
);

const TenantCredentialsModal = ({
  show,
  onClose,
  selectedTenant,
  credentialsData,
  setCredentialsData,
  credentialsStatus,
  loadingCredentials,
  onSubmit
}) => {
  if (!show || !selectedTenant) return null;

  const handleCredentialFocus = (e, section, field) => {
    const currentValue = credentialsData[section]?.[field];
    if (isMaskedValue(currentValue)) {
      setCredentialsData({
        ...credentialsData,
        [section]: { ...credentialsData[section], [field]: '' }
      });
    }
  };

  const handleCredentialChange = (section, field, value) => {
    setCredentialsData({
      ...credentialsData,
      [section]: { ...credentialsData[section], [field]: value }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Configure Credentials - {selectedTenant.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Enter the credentials for this client's services. Fields with existing values show masked data.
            </p>
            {loadingCredentials && (
              <p className="text-sm text-blue-600 mt-2">Loading saved credentials...</p>
            )}
          </div>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 space-y-6">
              {/* Firebase */}
              <CredentialSection title="Firebase Configuration" configured={credentialsStatus?.firebase?.projectId}>
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="API Key" value={credentialsData.firebase.apiKey} section="firebase" field="apiKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Auth Domain" value={credentialsData.firebase.authDomain} section="firebase" field="authDomain" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Project ID" value={credentialsData.firebase.projectId} section="firebase" field="projectId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Storage Bucket" value={credentialsData.firebase.storageBucket} section="firebase" field="storageBucket" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <div className="col-span-2">
                    <CredentialInput placeholder="Client Email (Service Account)" value={credentialsData.firebase.clientEmail} section="firebase" field="clientEmail" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  </div>
                  <div className="col-span-2">
                    <CredentialTextarea placeholder="Private Key (from service account JSON)" value={credentialsData.firebase.privateKey} section="firebase" field="privateKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  </div>
                </div>
              </CredentialSection>

              {/* MongoDB */}
              <CredentialSection title="MongoDB Configuration" configured={credentialsStatus?.mongodb?.uri}>
                <CredentialInput placeholder="MongoDB Connection URI" value={credentialsData.mongodb.uri} section="mongodb" field="uri" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
              </CredentialSection>

              {/* Razorpay */}
              <CredentialSection title="Razorpay Configuration" configured={credentialsStatus?.razorpay?.keyId}>
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="Key ID" value={credentialsData.razorpay.keyId} section="razorpay" field="keyId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Secret Key" value={credentialsData.razorpay.secretKey} section="razorpay" field="secretKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Email */}
              <CredentialSection title="Email Configuration (Gmail)" configured={credentialsStatus?.email?.user}>
                <p className="text-xs text-gray-500 mb-3">For Gmail, use your email and an App Password</p>
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="Email User (e.g., your@gmail.com)" value={credentialsData.email.user} section="email" field="user" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Email Password (App Password)" value={credentialsData.email.password} section="email" field="password" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Google Sheets & Drive */}
              <CredentialSection title="Google Sheets & Drive" configured={credentialsStatus?.googleSheets?.settingsSheetId}>
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="Products Sheet ID" value={credentialsData.googleSheets.productsSheetId} section="googleSheets" field="productsSheetId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Settings Sheet ID" value={credentialsData.googleSheets.settingsSheetId} section="googleSheets" field="settingsSheetId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Contact Sheet ID" value={credentialsData.googleSheets.contactSheetId} section="googleSheets" field="contactSheetId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Bookings Sheet ID" value={credentialsData.googleSheets.bookingsSheetId} section="googleSheets" field="bookingsSheetId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Webinar Registration Sheet ID" value={credentialsData.googleSheets.webinarSheetId} section="googleSheets" field="webinarSheetId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Blogs Folder ID" value={credentialsData.googleSheets.blogsFolderId} section="googleSheets" field="blogsFolderId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Books Folder ID" value={credentialsData.googleSheets.booksFolderId} section="googleSheets" field="booksFolderId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Portfolio Templates Folder ID" value={credentialsData.googleSheets.portfolioTemplatesFolderId} section="googleSheets" field="portfolioTemplatesFolderId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Policy Document IDs */}
              <CredentialSection title="Policy Page Document IDs (Google Docs)">
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="About Us Doc ID" value={credentialsData.policyDocs.aboutUsDocId} section="policyDocs" field="aboutUsDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Shipping Policy Doc ID" value={credentialsData.policyDocs.shippingPolicyDocId} section="policyDocs" field="shippingPolicyDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Terms & Conditions Doc ID" value={credentialsData.policyDocs.termsConditionsDocId} section="policyDocs" field="termsConditionsDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Cancellations & Refunds Doc ID" value={credentialsData.policyDocs.cancellationsRefundsDocId} section="policyDocs" field="cancellationsRefundsDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Privacy Policy Doc ID" value={credentialsData.policyDocs.privacyPolicyDocId} section="policyDocs" field="privacyPolicyDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Refund Policy Doc ID" value={credentialsData.policyDocs.refundPolicyDocId} section="policyDocs" field="refundPolicyDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Pricing Policy Doc ID" value={credentialsData.policyDocs.pricingPolicyDocId} section="policyDocs" field="pricingPolicyDocId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Cloudinary */}
              <CredentialSection title="Cloudinary Configuration">
                <div className="grid grid-cols-3 gap-3">
                  <CredentialInput placeholder="Cloud Name" value={credentialsData.cloudinary.cloudName} section="cloudinary" field="cloudName" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="API Key" value={credentialsData.cloudinary.apiKey} section="cloudinary" field="apiKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="API Secret" value={credentialsData.cloudinary.apiSecret} section="cloudinary" field="apiSecret" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* reCAPTCHA */}
              <CredentialSection title="reCAPTCHA Configuration">
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="Site Key" value={credentialsData.recaptcha.siteKey} section="recaptcha" field="siteKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Secret Key" value={credentialsData.recaptcha.secretKey} section="recaptcha" field="secretKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Booking Room Calendars */}
              <CredentialSection title="Booking Room Calendars (Google Calendar IDs)">
                <div className="grid grid-cols-1 gap-3">
                  <CredentialInput placeholder="Room 1 Calendar ID" value={credentialsData.bookingCalendars.room1CalendarId} section="bookingCalendars" field="room1CalendarId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Room 2 Calendar ID" value={credentialsData.bookingCalendars.room2CalendarId} section="bookingCalendars" field="room2CalendarId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Room 3 Calendar ID" value={credentialsData.bookingCalendars.room3CalendarId} section="bookingCalendars" field="room3CalendarId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Google APIs */}
              <CredentialSection title="Google APIs">
                <div className="grid grid-cols-2 gap-3">
                  <CredentialInput placeholder="Custom Search API Key" value={credentialsData.googleApis.customSearchApiKey} section="googleApis" field="customSearchApiKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Search Engine ID (cx)" value={credentialsData.googleApis.searchEngineId} section="googleApis" field="searchEngineId" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Gemini API Key" value={credentialsData.googleApis.geminiApiKey} section="googleApis" field="geminiApiKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                  <CredentialInput placeholder="Drive API Key" value={credentialsData.googleApis.driveApiKey} section="googleApis" field="driveApiKey" onChange={handleCredentialChange} onFocus={handleCredentialFocus} />
                </div>
              </CredentialSection>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-50 border border-green-300"></span>
                  Saved (click to replace)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-50 border border-blue-300"></span>
                  New value entered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-white border border-gray-300"></span>
                  Not configured
                </span>
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
                Save Credentials
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantCredentialsModal;
