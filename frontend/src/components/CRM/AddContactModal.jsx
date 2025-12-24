import React, { useState, useRef, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { Plus, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

const AddContactModal = ({ isOpen, onClose, onCreate, onRefresh }) => {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [contactData, setContactData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    email: '',
    emailCampaignId: '',
  });

  // Fetch email campaigns when modal opens
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
        setEmailCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Check if any form field has been filled (excluding emailCampaignId dropdown)
  const isFormFilled = Object.entries(contactData).some(([key, value]) =>
    key !== 'emailCampaignId' && value.trim() !== ''
  );

  // Check if file is uploaded
  const isFileUploaded = uploadedFile !== null;

  const handleChange = (field, value) => {
    setContactData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setContactData({
      companyName: '',
      contactPerson: '',
      designation: '',
      mobileNumber: '',
      email: '',
      emailCampaignId: '',
    });
    setUploadedFile(null);
    setUploadPreview(null);
    onClose();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only PNG, JPG, or JPEG files');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setUploadedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAndExtract = async () => {
    if (!uploadedFile || !uploadPreview) {
      toast.error('Please select a visiting card image');
      return;
    }

    try {
      setUploading(true);
      const token = await getToken();

      const response = await axios.post(
        `${API_BASE_URL}/email-campaigns/extract-and-store-crm`,
        { image: uploadPreview },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        if (response.data.crmData) {
          // Show different toast for duplicate vs new entry
          if (response.data.isDuplicate) {
            toast.info('Duplicate contact found - existing record updated!');
          } else {
            toast.success('Contact extracted and saved successfully!');
          }
          // Refresh the CRM list
          if (onRefresh) {
            onRefresh();
          }
          handleClose();
        } else {
          toast.warning(response.data.message || 'No email found in the visiting card');
        }
      } else {
        toast.error(response.data.message || 'Failed to extract data from visiting card');
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      toast.error(error.response?.data?.message || 'Failed to extract data from visiting card');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    // Validate email format only if email is provided
    if (contactData.email && contactData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setCreating(true);
      const result = await onCreate(contactData);
      if (result.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error creating CRM entry:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast.error('A contact with this email already exists');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add contact');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="add-modal-title"
      aria-describedby="add-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '90%', md: 700 },
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
              bgcolor: 'primary.lighter'
            }}>
              <Plus style={{ width: 20, height: 20, color: '#1976d2' }} />
            </Box>
            <Box>
              <Typography id="add-modal-title" variant="h6" component="h2" fontWeight={600}>
                Add New Contact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a visiting card or enter details manually
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Content */}
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          {/* Visiting Card Upload Section - Disabled when form is filled */}
          <Box sx={{
            mb: 3,
            opacity: isFormFilled ? 0.5 : 1,
            pointerEvents: isFormFilled ? 'none' : 'auto',
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CreditCardIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Upload Visiting Card (Front Side)
              </Typography>
              {isFormFilled && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontStyle: 'italic' }}>
                  (Disabled while form is filled)
                </Typography>
              )}
            </Box>

            {!uploadedFile ? (
              <Box
                onClick={() => !isFormFilled && fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.400',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: isFormFilled ? 'not-allowed' : 'pointer',
                  bgcolor: 'grey.50',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isFormFilled ? 'grey.50' : 'grey.100',
                    borderColor: isFormFilled ? 'grey.400' : 'primary.main',
                  }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" color="text.primary" fontWeight={500}>
                  Click to upload visiting card
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Supports PNG, JPG, JPEG (Max 5MB)
                </Typography>
              </Box>
            ) : (
              <Box sx={{
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 2,
                position: 'relative'
              }}>
                <IconButton
                  onClick={handleRemoveFile}
                  disabled={isFormFilled}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'white',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <X size={16} />
                </IconButton>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <img
                      src={uploadPreview}
                      alt="Visiting card preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {uploadedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={handleFileSelect}
              disabled={isFormFilled}
              style={{ display: 'none' }}
            />
          </Box>

          {/* OR Divider - Always show */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            my: 3
          }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'grey.300' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                px: 2,
                py: 0.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontWeight: 500
              }}
            >
              OR
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'grey.300' }} />
          </Box>

          {/* Manual Entry Form - Disabled when file is uploaded */}
          <Box sx={{
            opacity: isFileUploaded ? 0.5 : 1,
            pointerEvents: isFileUploaded ? 'none' : 'auto',
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Enter Details Manually
              </Typography>
              {isFileUploaded && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontStyle: 'italic' }}>
                  (Disabled while file is uploaded)
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                label="Company Name"
                value={contactData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g., Acme Corp"
                fullWidth
                size="small"
                disabled={isFileUploaded}
              />
              <TextField
                label="Contact Person"
                value={contactData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="e.g., John Doe"
                fullWidth
                size="small"
                disabled={isFileUploaded}
              />
              <TextField
                label="Designation"
                value={contactData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="e.g., CEO"
                fullWidth
                size="small"
                disabled={isFileUploaded}
              />
              <TextField
                label="Mobile Number"
                value={contactData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                placeholder="e.g., +1 234 567 8900"
                fullWidth
                size="small"
                disabled={isFileUploaded}
              />
              <TextField
                label="Email"
                type="email"
                value={contactData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g., john@acme.com"
                fullWidth
                size="small"
                disabled={isFileUploaded}
              />
              <FormControl fullWidth size="small" disabled={isFileUploaded || loadingCampaigns}>
                <InputLabel id="email-campaign-label">Email Campaign</InputLabel>
                <Select
                  labelId="email-campaign-label"
                  value={contactData.emailCampaignId}
                  label="Email Campaign"
                  onChange={(e) => handleChange('emailCampaignId', e.target.value)}
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
              </FormControl>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              All fields are optional. Empty fields will be set to "N/A".
            </Typography>
          </Box>
        </Box>

        {/* Modal Actions */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'grey.200', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={handleClose}
            disabled={creating || uploading}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          {isFileUploaded ? (
            <Button
              onClick={handleUploadAndExtract}
              disabled={uploading}
              variant="contained"
              color="primary"
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
              sx={{ textTransform: 'none' }}
            >
              {uploading ? 'Extracting...' : 'Extract & Save Contact'}
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={creating || !isFormFilled}
              variant="contained"
              color="primary"
              startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Plus style={{ width: 16, height: 16 }} />}
              sx={{ textTransform: 'none' }}
            >
              {creating ? 'Adding...' : 'Add Contact'}
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default AddContactModal;
