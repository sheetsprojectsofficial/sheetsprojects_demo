import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const AddAutomationModal = ({ isOpen, onClose, onSubmit }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    maxLeads: '',
    campaignId: '',
  });
  const [maxLeadsError, setMaxLeadsError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen]);

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const token = await getToken();

      const response = await axios.get(`${API_BASE_URL}/email-campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setFormData({
      prompt: '',
      maxLeads: '',
      campaignId: '',
    });
    setMaxLeadsError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.prompt || !formData.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const maxLeadsNum = parseInt(formData.maxLeads);
    if (formData.maxLeads === '' || isNaN(maxLeadsNum) || maxLeadsNum < 1 || maxLeadsNum > 20) {
      setMaxLeadsError('Enter number between 1-20');
      toast.error('Please enter a valid number between 1-20');
      return;
    }

    if (!formData.campaignId) {
      toast.error('Please select an email campaign');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const response = await axios.post(
        `${API_BASE_URL}/automations`,
        {
          prompt: formData.prompt.trim(),
          maxLeads: parseInt(formData.maxLeads),
          campaignId: formData.campaignId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Automation added! Scraping Google Maps in background...');
        if (onSubmit) {
          onSubmit(response.data.data);
        }
        handleClose();
      } else {
        toast.error(response.data.message || 'Failed to add automation');
      }
    } catch (error) {
      console.error('Error adding automation:', error);
      toast.error(error.response?.data?.message || 'Failed to add automation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="automation-modal-title"
      aria-describedby="automation-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '90%', md: 500 },
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        outline: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: '#f3e8ff'
            }}>
              <Zap style={{ width: 20, height: 20, color: '#9333ea' }} />
            </Box>
            <Box>
              <Typography id="automation-modal-title" variant="h6" component="h2" fontWeight={600}>
                Add Automation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure lead collection automation
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Content - Form */}
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Enter your prompt"
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="e.g., Find tech startups in Bangalore looking for CRM solutions"
              fullWidth
              multiline
              rows={3}
              required
              InputLabelProps={{
                required: true
              }}
            />

            <TextField
              label="How many leads to collect (max 20)"
              value={formData.maxLeads}
              onChange={(e) => {
                const inputValue = e.target.value;
                handleChange('maxLeads', inputValue);

                // Validate and show/hide error
                if (inputValue === '') {
                  setMaxLeadsError('');
                } else {
                  const parsed = parseInt(inputValue);
                  if (isNaN(parsed) || parsed < 1 || parsed > 20) {
                    setMaxLeadsError('Enter number between 1-20');
                  } else {
                    setMaxLeadsError('');
                  }
                }
              }}
              placeholder="e.g., 10"
              fullWidth
              error={!!maxLeadsError}
              helperText={maxLeadsError}
              FormHelperTextProps={{
                sx: { color: 'error.main' }
              }}
            />

            <FormControl fullWidth required>
              <InputLabel id="campaign-label">Map to Email Campaign</InputLabel>
              <Select
                labelId="campaign-label"
                value={formData.campaignId}
                label="Map to Email Campaign"
                onChange={(e) => handleChange('campaignId', e.target.value)}
                disabled={loadingCampaigns}
              >
                {loadingCampaigns ? (
                  <MenuItem disabled>Loading campaigns...</MenuItem>
                ) : campaigns.length === 0 ? (
                  <MenuItem disabled>No campaigns available</MenuItem>
                ) : (
                  campaigns.map((campaign) => (
                    <MenuItem key={campaign._id} value={campaign._id}>
                      {campaign.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Modal Actions */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'grey.200', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingCampaigns}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#9333ea',
              '&:hover': {
                bgcolor: '#7e22ce'
              }
            }}
            startIcon={loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Zap style={{ width: 16, height: 16 }} />}
          >
            {loading ? 'Adding...' : 'Add Automation'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddAutomationModal;
