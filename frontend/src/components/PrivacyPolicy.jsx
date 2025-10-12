import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Last updated: 03/08/2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              This Privacy Policy describes how we collect, use, and protect information that we collect from users of our website and/or mobile application.
            </p>

            {/* Personal Information We Collect */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We may collect the following personal information from our website/app users:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Name and contact information (such as email address, phone number, and mailing address)</li>
                <li>Payment information (such as credit card details or PayPal account information)</li>
                <li>Order history and purchase information</li>
                <li>Device and browser information</li>
                <li>IP address and geolocation data</li>
                <li>Any other information that you voluntarily provide to us</li>
              </ul>
            </div>

            {/* How We Collect Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Collect Information</h2>
              <p className="text-gray-700 mb-4">
                We may collect personal information from you when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Register an account with us</li>
                <li>Make a purchase through our website/app</li>
                <li>Sign up for our newsletter or other promotional materials</li>
                <li>Contact us through our website/app</li>
                <li>Provide feedback or submit reviews</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We may also collect information automatically through cookies or other tracking technologies when you visit our website or use our mobile application.
              </p>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
              <p className="text-gray-700 mb-4">
                We use the personal information that we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>To fulfill your orders and process payments</li>
                <li>To communicate with you about your orders or respond to your inquiries</li>
                <li>To send you promotional materials, newsletters, and other marketing communications</li>
                <li>To improve our website/app and customer service</li>
                <li>To comply with legal requirements or enforce our policies</li>
              </ul>
            </div>

            {/* How We Keep Information Safe */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Keep Information Safe</h2>
              <p className="text-gray-700">
                We take reasonable steps to protect the personal information that we collect from unauthorized access, use, or disclosure. We use industry-standard encryption technologies to secure your payment information, and we limit access to personal information to employees and contractors who have a need to know.
              </p>
            </div>

            {/* Information Sharing with Third Parties */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing with Third Parties</h2>
              <p className="text-gray-700 mb-4">
                We may share your personal information with third parties in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>With payment processors, shipping companies, or other service providers who help us fulfill orders and provide customer support</li>
                <li>With third-party marketing partners who assist us in promoting our products and services</li>
                <li>With legal authorities or regulatory bodies as required by law or to protect our rights or property</li>
              </ul>
            </div>

            {/* Your Choices and Rights */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Choices and Rights</h2>
              <p className="text-gray-700">
                You may choose not to provide personal information to us, but this may limit your ability to use certain features of our website or make purchases. You may also have the right to access, correct, or delete your personal information, and to object to or restrict our use of your personal information.
              </p>
            </div>

            {/* Changes to This Policy */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700">
                We reserve the right to modify this Privacy Policy at any time, so please review it frequently. Any changes will be effective immediately upon posting on our website.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
                <a href="tel:+919213723036" className="text-brand-primary hover:text-brand-primary font-medium">
                  +919213723036
                </a>.
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

export default PrivacyPolicy; 