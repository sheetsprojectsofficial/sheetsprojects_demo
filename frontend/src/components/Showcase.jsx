import React from 'react';
import ContactUs from './ContactUs';

const Showcase = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Showcase</h1>
          <p className="text-gray-600 mb-6">
            Explore our portfolio of successful Google Sheets automation projects.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">E-commerce Analytics Dashboard</h3>
              <p className="mb-4">Automated dashboard for tracking sales, inventory, and customer data.</p>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">Featured</span>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">HR Management System</h3>
              <p className="mb-4">Complete HR automation with employee tracking and reporting.</p>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">Popular</span>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Financial Reporting Tool</h3>
              <p className="mb-4">Automated financial reports and budget tracking system.</p>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">Advanced</span>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Project Management Tracker</h3>
              <p className="mb-4">Comprehensive project tracking with automated updates.</p>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">New</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <ContactUs />
    </div>
  );
};

export default Showcase; 