import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 text-lg">
            Effective date: 03/08/2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              Please read these Terms and Conditions ("Terms") carefully before using our website and/or mobile application (together, the "Service") operated by Mydrivekart.com ("us", "we", or "our").
            </p>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions or concerns about these Terms, please contact us at{' '}
                <a href="tel:+919213723036" className="text-brand-primary hover:text-brand-primary font-medium">
                  +919213723036
                </a>.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability and Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                The Service is provided on an "as is" and "as available" basis. We make no warranties, either express or implied, regarding the use or performance of the Service. We do not guarantee that the Service will be uninterrupted or error-free.
              </p>
              <p className="text-gray-700">
                We will not be liable for any damages arising from the use of the Service, including but not limited to direct, indirect, incidental, punitive, and consequential damages.
              </p>
            </div>

            {/* Rules of Conduct */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rules of Conduct</h2>
              <p className="text-gray-700 mb-4">
                By using the Service, you agree to the following rules of conduct:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>You will not use the Service for any unlawful purpose or in violation of these Terms.</li>
                <li>You will not post any content that is abusive, harassing, defamatory, or otherwise objectionable.</li>
                <li>You will not use the Service to transmit viruses, worms, or any other harmful code.</li>
                <li>You will not interfere with the operation of the Service, including but not limited to hacking, spamming, or disrupting the Service.</li>
              </ul>
            </div>

            {/* User Restrictions */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Restrictions</h2>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years of age to use the Service. By using the Service, you represent that you are at least 18 years old. If you are under 18 years old, you may only use the Service with the permission and supervision of a parent or legal guardian.
              </p>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your access to the Service at any time for any reason, including but not limited to violation of these Terms.
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to these Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time without prior notice. Your continued use of the Service after any changes to these Terms constitutes your acceptance of the new Terms.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws as applicable.
              </p>
            </div>
          </div>

          {/* Back to Home Button */}
          {/* <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 