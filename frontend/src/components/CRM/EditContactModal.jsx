import React, { useState, useEffect } from 'react';
import { Grid, TextField, Button, CircularProgress, Typography, Divider, Box } from '@mui/material';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';

const EditContactModal = ({ isOpen, onClose, entry, onSave, saving }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    landline: '',
    email: '',
    what: '',
    pitch: '',
    statusDate: '',
    statusUpdate: '',
    nextFollowupDate: '',
    demoDate: '',
    demoDone: '',
    comments: '',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        companyName: entry.companyName || '',
        contactPerson: entry.contactPerson || '',
        designation: entry.designation || '',
        mobileNumber: entry.mobileNumber || '',
        landline: entry.landline || '',
        email: entry.email || '',
        what: entry.what || '',
        pitch: entry.pitch || '',
        statusDate: entry.statusDate ? new Date(entry.statusDate).toISOString().split('T')[0] : '',
        statusUpdate: entry.statusUpdate || '',
        nextFollowupDate: entry.nextFollowupDate ? new Date(entry.nextFollowupDate).toISOString().split('T')[0] : '',
        demoDate: entry.demoDate ? new Date(entry.demoDate).toISOString().split('T')[0] : '',
        demoDone: entry.demoDone || '',
        comments: entry.comments || '',
      });
    }
  }, [entry]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(entry._id, formData);
  };

  const actions = (
    <>
      <Button
        onClick={onClose}
        disabled={saving}
        sx={{ color: '#6b7280' }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        disabled={saving}
        startIcon={saving ? <CircularProgress size={18} /> : <Save size={18} />}
        sx={{
          bgcolor: '#2563eb',
          '&:hover': { bgcolor: '#1d4ed8' },
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit Contact"
      actions={actions}
      maxWidth="lg"
      disableBackdropClick={saving}
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Landline"
                value={formData.landline}
                onChange={(e) => handleChange('landline', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            Status Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="What"
                value={formData.what}
                onChange={(e) => handleChange('what', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pitch"
                value={formData.pitch}
                onChange={(e) => handleChange('pitch', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Status Date"
                type="date"
                value={formData.statusDate}
                onChange={(e) => handleChange('statusDate', e.target.value)}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Status Update"
                value={formData.statusUpdate}
                onChange={(e) => handleChange('statusUpdate', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Followup Date"
                type="date"
                value={formData.nextFollowupDate}
                onChange={(e) => handleChange('nextFollowupDate', e.target.value)}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            Demo Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Demo Date"
                type="date"
                value={formData.demoDate}
                onChange={(e) => handleChange('demoDate', e.target.value)}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Demo Done"
                value={formData.demoDone}
                onChange={(e) => handleChange('demoDone', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comments"
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </Box>
      </form>
    </Modal>
  );
};

export default EditContactModal;
