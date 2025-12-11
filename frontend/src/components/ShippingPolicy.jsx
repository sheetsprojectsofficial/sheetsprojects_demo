import React from 'react';
import { Link } from 'react-router-dom';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Shipping Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Last updated: {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              This Shipping Policy outlines our practices regarding the delivery of products purchased through our platform. Please read this policy carefully to understand how we handle shipping and delivery.
            </p>

            {/* Digital Products */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Products</h2>
              <p className="text-gray-700 mb-4">
                For digital products (Google Sheets templates, app scripts, eBooks, courses, etc.):
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Instant delivery via email or dashboard access upon successful payment</li>
                <li>Access links are provided immediately after order confirmation</li>
                <li>No physical shipping required</li>
                <li>Download instructions will be sent to your registered email address</li>
                <li>You can access your purchases anytime from your account dashboard</li>
              </ul>
            </div>

            {/* Physical Products */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Physical Products (if applicable)</h2>
              <p className="text-gray-700 mb-4">
                For physical products, if any:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Processing time: 1-3 business days after payment confirmation</li>
                <li>Domestic shipping (within India): 5-7 business days</li>
                <li>International shipping: 10-15 business days (subject to customs clearance)</li>
                <li>Tracking information will be provided via email once the order is shipped</li>
              </ul>
            </div>

            {/* Shipping Charges */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Charges</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Digital products: No shipping charges</li>
                <li>Physical products: Shipping charges will be calculated at checkout based on location and weight</li>
                <li>Free shipping may be available for orders above a certain value (if applicable)</li>
              </ul>
            </div>

            {/* Order Tracking */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Tracking</h2>
              <p className="text-gray-700">
                You can track your order status through your account dashboard. For physical products, we will provide tracking information via email once the shipment is dispatched. You may also contact our support team for updates on your order.
              </p>
            </div>

            {/* Delivery Issues */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Issues</h2>
              <p className="text-gray-700 mb-4">
                If you experience any issues with delivery:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Digital products not received: Check your spam/junk folder or contact support within 24 hours</li>
                <li>Physical products delayed: Contact us after the expected delivery date has passed</li>
                <li>Damaged or incorrect items: Report within 48 hours of delivery with photographic evidence</li>
              </ul>
            </div>

            {/* Undeliverable Packages */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Undeliverable Packages</h2>
              <p className="text-gray-700">
                If a physical shipment is returned to us due to an incorrect address, refusal of delivery, or non-collection, we will contact you to arrange re-delivery. Additional shipping charges may apply for re-shipment.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                For any shipping-related queries, please contact us at{' '}
                <a href="tel:+919213723036" className="text-brand-primary hover:text-brand-primary font-medium">
                  +919213723036
                </a>{' '}
                or reach out through our{' '}
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

export default ShippingPolicy;
