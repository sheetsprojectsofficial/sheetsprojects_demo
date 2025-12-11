import React from 'react';
import { Link } from 'react-router-dom';

const CancellationsRefunds = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Cancellations and Refunds Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Last updated: {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              We strive to ensure customer satisfaction with all our products and services. This policy outlines the terms and conditions for cancellations and refunds.
            </p>

            {/* Cancellation Policy */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancellation Policy</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Digital Products</h3>
              <p className="text-gray-700 mb-4">
                For digital products (Google Sheets templates, app scripts, eBooks, courses, etc.):
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Cancellations can be requested before accessing or downloading the product</li>
                <li>Once the digital product has been accessed or downloaded, cancellations are not permitted due to the nature of digital goods</li>
                <li>If you encounter technical issues preventing access, please contact support immediately</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Physical Products</h3>
              <p className="text-gray-700 mb-4">
                For physical products (if applicable):
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Cancellations are accepted within 24 hours of order placement if the order has not been shipped</li>
                <li>Once the order is shipped, cancellation is not possible, but you may return the product as per our return policy</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Services & Bookings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Bookings and consultation appointments can be cancelled up to 48 hours before the scheduled time</li>
                <li>Cancellations made less than 48 hours before the appointment may incur a cancellation fee</li>
              </ul>
            </div>

            {/* Refund Policy */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Policy</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Digital Products</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Refunds are only issued if the product is defective or not as described</li>
                <li>No refunds once the digital product has been accessed or downloaded</li>
                <li>If you receive a defective product, report it within 7 days of purchase with details</li>
                <li>Approved refunds will be processed within 7-10 business days</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Physical Products</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Full refund if cancelled within 24 hours before shipment</li>
                <li>Returns accepted within 7 days of delivery for defective or damaged items</li>
                <li>Product must be unused and in original packaging for return</li>
                <li>Shipping charges are non-refundable unless the product is defective</li>
                <li>Refunds processed within 10-14 business days after receiving the returned item</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Services & Bookings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Full refund for cancellations made 48+ hours before scheduled time</li>
                <li>50% refund for cancellations made 24-48 hours before scheduled time</li>
                <li>No refund for cancellations made less than 24 hours before or no-shows</li>
              </ul>
            </div>

            {/* Refund Method */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Method</h2>
              <p className="text-gray-700">
                All refunds will be processed back to the original payment method used during purchase. The time taken for the refund to reflect in your account may vary based on your bank or payment provider (typically 5-10 business days).
              </p>
            </div>

            {/* How to Request Cancellation or Refund */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request Cancellation or Refund</h2>
              <p className="text-gray-700 mb-4">
                To request a cancellation or refund:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Contact our support team via email or phone</li>
                <li>Provide your order number and reason for cancellation/refund</li>
                <li>For defective products, include photographic evidence</li>
                <li>Our team will review your request and respond within 2-3 business days</li>
              </ol>
            </div>

            {/* Exceptions */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Exceptions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Custom-made or personalized products are non-refundable once production has started</li>
                <li>Free products are not eligible for refunds (as no payment was made)</li>
                <li>Promotional or discounted items may have different refund terms (specified at the time of purchase)</li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                For cancellation or refund requests, please contact us at{' '}
                <a href="tel:+919213723036" className="text-brand-primary hover:text-brand-primary font-medium">
                  +919213723036
                </a>{' '}
                or through our{' '}
                <Link to="/contact" className="text-brand-primary hover:text-brand-primary font-medium">
                  contact page
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationsRefunds;
