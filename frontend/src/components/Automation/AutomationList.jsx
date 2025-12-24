import React, { useState, useEffect } from 'react';
import { Zap, Trash2, Play, Pause, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const AutomationList = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState({});

  useEffect(() => {
    fetchAutomations();
    fetchCampaigns();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await axios.get(`${API_BASE_URL}/automations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAutomations(response.data.data || response.data.automations || []);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
      // For now, use empty array if API doesn't exist yet
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(`${API_BASE_URL}/email-campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const campaignMap = {};
        (response.data.campaigns || []).forEach(c => {
          campaignMap[c._id] = c.name;
        });
        setCampaigns(campaignMap);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleDelete = async (automationId) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) {
      return;
    }

    try {
      const token = await getToken();

      await axios.delete(`${API_BASE_URL}/automations/${automationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Automation deleted successfully');
      fetchAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast.error('Failed to delete automation');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCampaignClick = (campaignId) => {
    if (campaignId) {
      navigate(`/dashboard?tab=email-campaign&campaignId=${campaignId}&step=5&source=automation`);
    }
  };

  const getCampaignId = (automation) => {
    if (automation.campaignId?._id) {
      return automation.campaignId._id;
    }
    return automation.campaignId;
  };

  const getCampaignName = (automation) => {
    if (automation.campaignId?.name) {
      return automation.campaignId.name;
    }
    return campaigns[automation.campaignId] || 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      running: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || statusStyles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage your lead collection automations ({automations.length} total)
        </p>
      </div>

      {automations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Create your first automation from the CRM page by clicking the "Add Automation" button.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emails Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mapped Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {automations.map((automation, index) => (
                  <tr key={automation._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={automation.prompt}>
                        {automation.prompt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {automation.maxLeads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {automation.leadsCollected || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={automation.emailsFound > 0 ? 'text-green-600 font-medium' : ''}>
                        {automation.emailsFound || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getCampaignId(automation) ? (
                        <button
                          onClick={() => handleCampaignClick(getCampaignId(automation))}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium flex items-center gap-1"
                        >
                          {getCampaignName(automation)}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(automation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(automation.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDelete(automation._id)}
                          className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationList;
