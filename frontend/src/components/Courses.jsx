import React from 'react';

const Courses = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Courses</h1>
        <p className="text-gray-600 mb-6">
          Learn Google Sheets automation through our comprehensive online courses.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-blue-500 h-32 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Beginner</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Sheets Basics</h3>
              <p className="text-gray-600 mb-4">Learn the fundamentals of Google Sheets automation.</p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">$49</span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-green-500 h-32 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Intermediate</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Automation</h3>
              <p className="text-gray-600 mb-4">Master advanced automation techniques and workflows.</p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">$99</span>
                <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-500 h-32 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Advanced</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Integration</h3>
              <p className="text-gray-600 mb-4">Learn to integrate Google Sheets with external systems.</p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold">$149</span>
                <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses; 