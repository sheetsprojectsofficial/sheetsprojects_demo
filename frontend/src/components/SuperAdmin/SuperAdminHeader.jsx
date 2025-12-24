import React from 'react';

const tabConfig = {
  dashboard: { title: 'Dashboard', subtitle: 'System overview and statistics' },
  users: { title: 'Users', subtitle: 'Manage all users and their roles' },
};

const SuperAdminHeader = ({ user, activeTab, onToggleSidebar, onLogout }) => {
  const { title, subtitle } = tabConfig[activeTab] || { title: '', subtitle: '' };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            View Site
          </a>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
