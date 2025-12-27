import React from 'react';

const TenantStatsCards = ({ tenants }) => {
  const totalCount = tenants.length;
  const activeCount = tenants.filter(t => t.isActive).length;
  const inactiveCount = tenants.filter(t => !t.isActive).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Total Clients</p>
        <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Active Clients</p>
        <p className="text-2xl font-bold text-green-600">{activeCount}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Inactive Clients</p>
        <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
      </div>
    </div>
  );
};

export default TenantStatsCards;
