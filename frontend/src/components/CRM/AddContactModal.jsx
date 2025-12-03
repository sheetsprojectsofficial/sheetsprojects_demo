import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const AddContactModal = ({ isOpen, onClose, onCreate }) => {
  const [creating, setCreating] = useState(false);
  const [contactData, setContactData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    landline: '',
    email: '',
  });

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
      landline: '',
      email: '',
    });
    onClose();
  };

  const handleCreate = async () => {
    // Validate email
    if (!contactData.email || !contactData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
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
                Enter contact details manually
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Content - Form */}
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              label="Company Name"
              value={contactData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="e.g., Acme Corp"
              fullWidth
              size="small"
            />
            <TextField
              label="Contact Person"
              value={contactData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              placeholder="e.g., John Doe"
              fullWidth
              size="small"
            />
            <TextField
              label="Designation"
              value={contactData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g., CEO"
              fullWidth
              size="small"
            />
            <TextField
              label="Mobile Number"
              value={contactData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              placeholder="e.g., +1 234 567 8900"
              fullWidth
              size="small"
            />
            <TextField
              label="Landline"
              value={contactData.landline}
              onChange={(e) => handleChange('landline', e.target.value)}
              placeholder="e.g., +1 234 567 8901"
              fullWidth
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              value={contactData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g., john@acme.com"
              required
              fullWidth
              size="small"
              InputLabelProps={{
                required: true
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            <span style={{ color: '#d32f2f' }}>*</span> Required field. All other fields are optional and will be set to "N/A" if left empty.
          </Typography>
        </Box>

        {/* Modal Actions */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'grey.200', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={handleClose}
            disabled={creating}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating}
            variant="contained"
            color="primary"
            startIcon={creating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Plus style={{ width: 16, height: 16 }} />}
            sx={{ textTransform: 'none' }}
          >
            {creating ? 'Adding...' : 'Add Contact'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddContactModal;
