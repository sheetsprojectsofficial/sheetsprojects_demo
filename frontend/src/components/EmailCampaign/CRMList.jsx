import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Trash2, Image, Check, X, Circle, Search, Send } from 'lucide-react';
import { Avatar, Box, IconButton, TextField, Select, MenuItem, Tooltip } from '@mui/material';
import { useCRM } from '../../hooks/useCRM';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import DataGrid from '../common/DataGrid';
import DeleteContactModal from '../CRM/DeleteContactModal';
import AddContactModal from '../CRM/AddContactModal';
import AddAutomationModal from '../CRM/AddAutomationModal';
import ImageViewModal from '../CRM/ImageViewModal';
import EmptyState from '../CRM/EmptyState';
import LoadingState from '../CRM/LoadingState';
import { toast } from 'react-toastify';

const CRMList = () => {
  const {
    crmEntries,
    loading,
    editingId,
    editedData,
    saving,
    handleEdit,
    handleCancelEdit,
    handleFieldChange,
    handleSave,
    deleteContact,
    createContact,
    refreshEntries,
    bulkDeleteContacts,
  } = useCRM();

  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, entry: null });
  const [addModal, setAddModal] = useState(false);
  const [automationModal, setAutomationModal] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: null });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Cell editing state
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingColumnField, setEditingColumnField] = useState(null);
  const [updatingContactId, setUpdatingContactId] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Status filter state
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');

  // Email campaigns state
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Fetch email campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const token = await getToken();

        const response = await apiFetch('/email-campaigns', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setEmailCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [getToken]);

  const openDeleteModal = (entry) => {
    setDeleteModal({ isOpen: true, entry });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, entry: null });
  };

  const openAddModal = () => {
    setAddModal(true);
  };

  const closeAddModal = () => {
    setAddModal(false);
  };

  const openAutomationModal = () => {
    setAutomationModal(true);
  };

  const closeAutomationModal = () => {
    setAutomationModal(false);
  };

  const openImageModal = (imageUrl) => {
    setImageModal({ isOpen: true, imageUrl });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: null });
  };

  // Selection handlers
  const handleSelectChange = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(crmEntries.map(entry => entry._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmMessage = selectedIds.length === 1
      ? 'Are you sure you want to delete this contact?'
      : `Are you sure you want to delete ${selectedIds.length} contacts?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setBulkDeleting(true);
      await bulkDeleteContacts(selectedIds);
      setSelectedIds([]);
      toast.success(
        selectedIds.length === 1
          ? 'Contact deleted successfully'
          : `${selectedIds.length} contacts deleted successfully`
      );
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast.error('Failed to delete contacts');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stop editing
  const stopEditing = () => {
    setEditingCell(null);
    setEditingValue('');
    setEditingColumnField(null);
  };

  // Update contact field
  const handleUpdateContactField = async (contactId, field, value) => {
    try {
      setUpdatingContactId(contactId);
      const token = await getToken();

      // Find the original entry
      const entry = crmEntries.find(e => e._id === contactId);
      if (!entry) throw new Error('Entry not found');

      // Prepare update data with all fields from the entry
      const updateData = {
        companyName: entry.companyName || '',
        contactPerson: entry.contactPerson || '',
        designation: entry.designation || '',
        mobileNumber: entry.mobileNumber || '',
        landline: entry.landline || '',
        email: entry.email || '',
        what: entry.what || '',
        pitch: entry.pitch || '',
        statusDate: entry.statusDate || '',
        statusUpdate: entry.statusUpdate || '',
        nextFollowupDate: entry.nextFollowupDate || '',
        demoDate: entry.demoDate || '',
        demoDone: entry.demoDone || '',
        comments: entry.comments || '',
        leadStatus: entry.leadStatus || '',
        emailCampaignId: entry.emailCampaignId || null,
        [field]: value, // Update the specific field
      };

      const response = await apiFetch(
        `/email-campaigns/crm-entries/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Contact updated successfully');
        await refreshEntries();
      } else {
        toast.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setUpdatingContactId(null);
    }
  };

  // Sync lead with email campaign (add/remove from recipients)
  const handleSyncLeadWithCampaign = async (leadId, newCampaignId, oldCampaignId) => {
    try {
      setUpdatingContactId(leadId);
      const token = await getToken();

      const response = await apiFetch(
        '/email-campaigns/crm-entries/sync-campaign',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId,
            newCampaignId: newCampaignId || null,
            oldCampaignId: oldCampaignId || null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Campaign updated successfully');
        await refreshEntries();
      } else {
        toast.error(data.message || 'Failed to sync with campaign');
      }
    } catch (error) {
      console.error('Error syncing lead with campaign:', error);
      toast.error('Failed to sync with campaign');
    } finally {
      setUpdatingContactId(null);
    }
  };

  // Get column width - increases when editing
  const getColumnWidth = (field, defaultWidth) => {
    const editableWidths = {
      companyName: { normal: 200, editing: 350 },
      contactPerson: { normal: 200, editing: 350 },
      designation: { normal: 180, editing: 300 },
      mobileNumber: { normal: 180, editing: 300 },
      landline: { normal: 150, editing: 280 },
      email: { normal: 250, editing: 380 },
      what: { normal: 180, editing: 300 },
      pitch: { normal: 180, editing: 300 },
      statusDate: { normal: 180, editing: 280 },
      statusUpdate: { normal: 200, editing: 350 },
      nextFollowupDate: { normal: 180, editing: 280 },
      demoDate: { normal: 180, editing: 280 },
      demoDone: { normal: 150, editing: 280 },
      comments: { normal: 250, editing: 380 },
    };

    if (editingColumnField === field && editableWidths[field]) {
      return editableWidths[field].editing;
    }
    return editableWidths[field]?.normal || defaultWidth;
  };

  // Editable TextField Component
  const EditableTextField = ({ value, onChange, onSave, onCancel, disabled, type = 'text' }) => {
    const inputRef = useRef(null);
    const cursorPosition = useRef(null);

    useEffect(() => {
      if (inputRef.current && cursorPosition.current !== null) {
        inputRef.current.setSelectionRange(cursorPosition.current, cursorPosition.current);
      }
    }, [value]);

    const handleChange = (e) => {
      cursorPosition.current = e.target.selectionStart;
      onChange(e.target.value);
    };

    return (
      <TextField
        inputRef={inputRef}
        size="small"
        type={type}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            onSave();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        autoFocus
        disabled={disabled}
        sx={{
          flex: 1,
          minWidth: 120,
          '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.85rem' },
          '& .MuiOutlinedInput-input': { padding: '8px 12px', textAlign: 'center' },
        }}
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
      />
    );
  };

  // Render editable cell
  const renderEditableCell = (entry, field, value, type = 'text') => {
    const isEditing = editingCell?.contactId === entry._id && editingCell?.field === field;
    const displayValue = value || 'N/A';

    if (isEditing) {
      return (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, px: 1 }} onClick={(e) => e.stopPropagation()}>
          <EditableTextField
            value={editingValue}
            onChange={setEditingValue}
            type={type}
            onSave={() => {
              handleUpdateContactField(entry._id, field, editingValue);
              stopEditing();
            }}
            onCancel={stopEditing}
            disabled={updatingContactId === entry._id}
          />
          <IconButton
            size="small"
            onClick={() => {
              handleUpdateContactField(entry._id, field, editingValue);
              stopEditing();
            }}
            disabled={updatingContactId === entry._id}
            sx={{ color: '#22c55e', flexShrink: 0 }}
          >
            <Check size={18} />
          </IconButton>
          <IconButton
            size="small"
            onClick={stopEditing}
            sx={{ color: '#ef4444', flexShrink: 0 }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: '100%',
          textAlign: 'center',
          color: '#475569',
          cursor: 'pointer',
          py: 1,
          px: 2,
          borderRadius: '4px',
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
        onClick={() => {
          setEditingCell({ contactId: entry._id, field });
          // If value is "N/A", show empty field for editing
          setEditingValue(value === 'N/A' ? '' : (value || ''));
          setEditingColumnField(field);
        }}
      >
        {displayValue}
      </Box>
    );
  };

  // Define columns for DataGrid
  const columns = useMemo(() => {
    const entry = (params) => crmEntries.find(e => e._id === params.row.id);

    return [
      {
        field: 'serialNumber',
        headerName: 'S.NO.',
        width: 70,
        sortable: true,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'cardImageUrl',
        headerName: 'IMAGE',
        width: 100,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {params.value ? (
              <img
                src={params.value}
                alt="Visiting card"
                style={{
                  width: '60px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openImageModal(params.value);
                }}
              />
            ) : (
              <Avatar sx={{ width: 40, height: 40, bgcolor: '#f3f4f6' }}>
                <Image size={20} color="#9ca3af" />
              </Avatar>
            )}
          </Box>
        ),
      },
      {
        field: 'leadStatus',
        headerName: 'STATUS',
        width: 150,
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const currentEntry = entry(params);
          const status = params.value;

          const getColor = (val) => {
            switch (val?.toLowerCase()) {
              case 'hot': return '#ef4444';
              case 'cold': return '#f97316';
              case 'dead': return '#9ca3af';
              case 'converted': return '#22c55e';
              default: return '#d1d5db';
            }
          };

          return (
            <Select
              value={status || ''}
              onChange={(e) => handleUpdateContactField(currentEntry._id, 'leadStatus', e.target.value)}
              disabled={updatingContactId === currentEntry?._id}
              size="small"
              displayEmpty
              onClick={(e) => e.stopPropagation()}
              sx={{
                minWidth: 120,
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e7eb',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d5db',
                },
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Circle size={10} fill={getColor(value)} color={getColor(value)} />
                  <span>{value || 'Select'}</span>
                </Box>
              )}
            >
              <MenuItem value="">
                <Circle size={10} fill="#d1d5db" color="#d1d5db" style={{ marginRight: 8 }} />
                Select
              </MenuItem>
              <MenuItem value="Hot">
                <Circle size={10} fill="#ef4444" color="#ef4444" style={{ marginRight: 8 }} />
                Hot
              </MenuItem>
              <MenuItem value="Cold">
                <Circle size={10} fill="#f97316" color="#f97316" style={{ marginRight: 8 }} />
                Cold
              </MenuItem>
              <MenuItem value="Dead">
                <Circle size={10} fill="#9ca3af" color="#9ca3af" style={{ marginRight: 8 }} />
                Dead
              </MenuItem>
              <MenuItem value="Converted">
                <Circle size={10} fill="#22c55e" color="#22c55e" style={{ marginRight: 8 }} />
                Converted
              </MenuItem>
            </Select>
          );
        },
      },
      {
        field: 'emailCampaignId',
        headerName: 'EMAIL CAMPAIGN',
        width: 240,
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const currentEntry = entry(params);
          const campaignId = params.value;

          // Find the campaign name
          const selectedCampaign = emailCampaigns.find(c => c._id === campaignId);

          // Navigate to campaign Step 5 with source=leads filter
          const handleGoToCampaign = (e) => {
            e.stopPropagation();
            if (campaignId) {
              navigate(`/dashboard?tab=email-campaign&campaignId=${campaignId}&step=5&source=leads`);
            }
          };

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', height: '100%' }}>
              <Select
                value={campaignId || ''}
                onChange={(e) => {
                  const newCampaignId = e.target.value || null;
                  const oldCampaignId = campaignId || null;
                  // Only sync if the value actually changed
                  if (newCampaignId !== oldCampaignId) {
                    handleSyncLeadWithCampaign(currentEntry._id, newCampaignId, oldCampaignId);
                  }
                }}
                disabled={updatingContactId === currentEntry?._id || loadingCampaigns}
                size="small"
                displayEmpty
                onClick={(e) => e.stopPropagation()}
                sx={{
                  minWidth: 140,
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db',
                  },
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{selectedCampaign?.name || 'Select'}</span>
                  </Box>
                )}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {loadingCampaigns ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : emailCampaigns.length === 0 ? (
                  <MenuItem disabled>No campaigns available</MenuItem>
                ) : (
                  emailCampaigns.map((campaign) => (
                    <MenuItem key={campaign._id} value={campaign._id}>
                      {campaign.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {campaignId && (
                <Tooltip title="Go to campaign & send emails" arrow>
                  <IconButton
                    size="small"
                    onClick={handleGoToCampaign}
                    sx={{
                      bgcolor: '#3b82f6',
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: '#2563eb',
                      },
                    }}
                  >
                    <Send size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        field: 'companyName',
        headerName: 'COMPANY NAME',
        width: getColumnWidth('companyName', 200),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'companyName', params.value),
      },
      {
        field: 'contactPerson',
        headerName: 'CONTACT PERSON',
        width: getColumnWidth('contactPerson', 200),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'contactPerson', params.value),
      },
      {
        field: 'designation',
        headerName: 'DESIGNATION',
        width: getColumnWidth('designation', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'designation', params.value),
      },
      {
        field: 'mobileNumber',
        headerName: 'MOBILE NUMBER',
        width: getColumnWidth('mobileNumber', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'mobileNumber', params.value),
      },
      {
        field: 'landline',
        headerName: 'LANDLINE',
        width: getColumnWidth('landline', 150),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'landline', params.value),
      },
      {
        field: 'email',
        headerName: 'EMAIL',
        width: getColumnWidth('email', 250),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'email', params.value, 'email'),
      },
      {
        field: 'what',
        headerName: 'STATUS: What',
        width: getColumnWidth('what', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'what', params.value),
      },
      {
        field: 'pitch',
        headerName: 'STATUS: Pitch',
        width: getColumnWidth('pitch', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'pitch', params.value),
      },
      {
        field: 'statusDate',
        headerName: 'STATUS: Date',
        width: getColumnWidth('statusDate', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value) => value ? formatDate(value) : 'N/A',
        renderCell: (params) => {
          const dateValue = entry(params)?.statusDate;
          return renderEditableCell(entry(params), 'statusDate', dateValue ? new Date(dateValue).toISOString().split('T')[0] : '', 'date');
        },
      },
      {
        field: 'statusUpdate',
        headerName: 'STATUS: Update',
        width: getColumnWidth('statusUpdate', 200),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'statusUpdate', params.value),
      },
      {
        field: 'nextFollowupDate',
        headerName: 'NEXT FOLLOWUP',
        width: getColumnWidth('nextFollowupDate', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        sortComparator: (v1, v2) => {
          // Handle null/empty values - push them to the end
          if (!v1 && !v2) return 0;
          if (!v1) return 1;
          if (!v2) return -1;
          return new Date(v1) - new Date(v2);
        },
        renderCell: (params) => {
          const dateValue = entry(params)?.nextFollowupDate;
          return renderEditableCell(entry(params), 'nextFollowupDate', dateValue ? new Date(dateValue).toISOString().split('T')[0] : '', 'date');
        },
      },
      {
        field: 'demoDate',
        headerName: 'DEMO: Date',
        width: getColumnWidth('demoDate', 180),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value) => value ? formatDate(value) : 'N/A',
        renderCell: (params) => {
          const dateValue = entry(params)?.demoDate;
          return renderEditableCell(entry(params), 'demoDate', dateValue ? new Date(dateValue).toISOString().split('T')[0] : '', 'date');
        },
      },
      {
        field: 'demoDone',
        headerName: 'DEMO: Done',
        width: getColumnWidth('demoDone', 150),
        sortable: true,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'demoDone', params.value),
      },
      {
        field: 'comments',
        headerName: 'DEMO: Comments',
        width: getColumnWidth('comments', 250),
        sortable: false,
        filterable: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => renderEditableCell(entry(params), 'comments', params.value),
      },
    ];
  }, [crmEntries, editingCell, editingValue, editingColumnField, updatingContactId, emailCampaigns, loadingCampaigns]);

  // Transform entries to rows
  const rows = useMemo(() =>
    crmEntries.map((entry, index) => ({
      id: entry._id,
      serialNumber: index + 1,
      cardImageUrl: entry.cardImageUrl,
      leadStatus: entry.leadStatus,
      emailCampaignId: entry.emailCampaignId,
      companyName: entry.companyName,
      contactPerson: entry.contactPerson,
      designation: entry.designation,
      mobileNumber: entry.mobileNumber,
      landline: entry.landline,
      email: entry.email,
      what: entry.what,
      pitch: entry.pitch,
      statusDate: entry.statusDate,
      statusUpdate: entry.statusUpdate,
      nextFollowupDate: entry.nextFollowupDate,
      demoDate: entry.demoDate,
      demoDone: entry.demoDone,
      comments: entry.comments,
      originalEntry: entry,
    })),
    [crmEntries]
  );

  // Filter rows based on search query and status filter
  const filteredRows = useMemo(() => {
    let result = rows;

    // Filter by status
    if (activeStatusFilter !== 'all') {
      if (activeStatusFilter === 'new') {
        // "New" means no status set (empty or null)
        result = result.filter((row) => !row.leadStatus || row.leadStatus === '');
      } else {
        result = result.filter((row) => row.leadStatus?.toLowerCase() === activeStatusFilter.toLowerCase());
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        return (
          row.companyName?.toLowerCase().includes(query) ||
          row.contactPerson?.toLowerCase().includes(query) ||
          row.designation?.toLowerCase().includes(query) ||
          row.mobileNumber?.toLowerCase().includes(query) ||
          row.landline?.toLowerCase().includes(query) ||
          row.email?.toLowerCase().includes(query) ||
          row.leadStatus?.toLowerCase().includes(query) ||
          row.what?.toLowerCase().includes(query) ||
          row.pitch?.toLowerCase().includes(query) ||
          row.statusUpdate?.toLowerCase().includes(query) ||
          row.demoDone?.toLowerCase().includes(query) ||
          row.comments?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [rows, searchQuery, activeStatusFilter]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const counts = {
      all: rows.length,
      new: rows.filter((row) => !row.leadStatus || row.leadStatus === '').length,
      hot: rows.filter((row) => row.leadStatus?.toLowerCase() === 'hot').length,
      cold: rows.filter((row) => row.leadStatus?.toLowerCase() === 'cold').length,
      dead: rows.filter((row) => row.leadStatus?.toLowerCase() === 'dead').length,
      converted: rows.filter((row) => row.leadStatus?.toLowerCase() === 'converted').length,
    };
    return counts;
  }, [rows]);

  // Get row class name based on lead status for row coloring
  const getRowClassName = (params) => {
    const status = params.row.leadStatus?.toLowerCase();
    switch (status) {
      case 'hot':
        return 'row-status-hot';
      case 'cold':
        return 'row-status-cold';
      case 'dead':
        return 'row-status-dead';
      case 'converted':
        return 'row-status-converted';
      default:
        return '';
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="w-full relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Database</h1>
          <p className="mt-2 text-sm text-gray-600">
            {searchQuery || activeStatusFilter !== 'all' ? (
              <>Showing {filteredRows.length} of {crmEntries.length} contacts</>
            ) : (
              <>All contacts extracted from visiting cards ({crmEntries.length} total)</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkDeleting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              {selectedIds.length === 1 ? 'Delete Row' : `Delete Row(s)`}
            </button>
          )}
          <button
            onClick={openAutomationModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm font-medium cursor-pointer"
          >
            <Zap className="h-5 w-5" />
            Add Automation
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-all shadow-sm font-medium cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Add New Contact
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'all'
              ? 'bg-gray-800 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'all' ? 'bg-gray-600' : 'bg-gray-100'
          }`}>
            {statusCounts.all}
          </span>
        </button>
        <button
          onClick={() => setActiveStatusFilter('new')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'new'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            New
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'new' ? 'bg-blue-400' : 'bg-gray-100'
          }`}>
            {statusCounts.new}
          </span>
        </button>
        <button
          onClick={() => setActiveStatusFilter('hot')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'hot'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Hot
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'hot' ? 'bg-red-400' : 'bg-gray-100'
          }`}>
            {statusCounts.hot}
          </span>
        </button>
        <button
          onClick={() => setActiveStatusFilter('cold')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'cold'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Cold
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'cold' ? 'bg-orange-400' : 'bg-gray-100'
          }`}>
            {statusCounts.cold}
          </span>
        </button>
        <button
          onClick={() => setActiveStatusFilter('dead')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'dead'
              ? 'bg-gray-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            Dead
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'dead' ? 'bg-gray-400' : 'bg-gray-100'
          }`}>
            {statusCounts.dead}
          </span>
        </button>
        <button
          onClick={() => setActiveStatusFilter('converted')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeStatusFilter === 'converted'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Converted
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeStatusFilter === 'converted' ? 'bg-green-400' : 'bg-gray-100'
          }`}>
            {statusCounts.converted}
          </span>
        </button>
      </div>

      {crmEntries.length === 0 ? (
        <EmptyState />
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            {searchQuery && activeStatusFilter !== 'all'
              ? `No contacts match your search "${searchQuery}" in ${activeStatusFilter === 'new' ? 'New' : activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1)} status`
              : searchQuery
                ? `No contacts match your search "${searchQuery}"`
                : `No contacts with ${activeStatusFilter === 'new' ? 'New' : activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1)} status`
            }
          </p>
          <div className="flex justify-center gap-3 mt-4">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="cursor-pointer px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear search
              </button>
            )}
            {activeStatusFilter !== 'all' && (
              <button
                onClick={() => setActiveStatusFilter('all')}
                className="cursor-pointer px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Show all contacts
              </button>
            )}
          </div>
        </div>
      ) : (
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={(newSelection) => {
            // Handle selection changes
            const added = newSelection.filter(id => !selectedIds.includes(id));
            const removed = selectedIds.filter(id => !newSelection.includes(id));

            added.forEach(id => handleSelectChange(id, true));
            removed.forEach(id => handleSelectChange(id, false));
          }}
          pageSize={25}
          initialSortField="nextFollowupDate"
          initialSortOrder="asc"
          getRowClassName={getRowClassName}
        />
      )}

      <DeleteContactModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        entry={deleteModal.entry}
        onDelete={deleteContact}
      />

      <AddContactModal
        isOpen={addModal}
        onClose={closeAddModal}
        onCreate={createContact}
        onRefresh={refreshEntries}
      />

      <AddAutomationModal
        isOpen={automationModal}
        onClose={closeAutomationModal}
        onSubmit={(data) => {
          console.log('Automation data:', data);
          // TODO: Implement automation logic
        }}
      />

      <ImageViewModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        onClose={closeImageModal}
      />
    </div>
  );
};

export default CRMList;
