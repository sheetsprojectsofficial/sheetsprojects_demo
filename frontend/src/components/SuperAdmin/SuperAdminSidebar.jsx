import React from 'react';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

const SuperAdminSidebar = ({
  user,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 shadow-sm transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0`}>
      <div className="h-full flex flex-col relative">
        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Header */}
        <div className={`flex-shrink-0 ${isCollapsed ? 'px-4 py-5' : 'px-5 py-4'} border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                  S
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-gray-900">Super Admin</h1>
                    <p className="text-xs text-gray-500">Full system access</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} py-4`}>
          {!isCollapsed && (
            <div className="px-3 py-2 mb-2">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Menu</h3>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`${
                  activeTab === item.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } group flex items-center cursor-pointer ${
                  isCollapsed ? 'justify-center px-2' : 'px-3'
                } py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full`}
                title={isCollapsed ? item.label : ''}
              >
                {item.icon}
                {!isCollapsed && <span className="flex-1 text-left ml-3">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info at Bottom */}
        {!isCollapsed && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
