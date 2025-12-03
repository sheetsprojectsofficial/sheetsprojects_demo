import React, { useState } from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const DeleteContactModal = ({ isOpen, onClose, entry, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!entry) return;

    try {
      setDeleting(true);
      const success = await onDelete(entry._id);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting CRM entry:', error);
      toast.error(error.response?.data?.message || 'Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 500 },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        outline: 'none'
      }}>
        {/* Modal Header */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'error.lighter',
            flexShrink: 0
          }}>
            <Trash2 style={{ width: 24, height: 24, color: '#d32f2f' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography id="delete-modal-title" variant="h6" component="h2" fontWeight={600} mb={1}>
              Delete Contact
            </Typography>
            <Typography id="delete-modal-description" variant="body2" color="text.secondary" mb={2}>
              Are you sure you want to delete this contact? This action cannot be undone.
            </Typography>
            {entry && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.200' }}>
                <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                  {entry.contactPerson}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.companyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.email}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Modal Actions */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'grey.200', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={deleting}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
            sx={{ textTransform: 'none' }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DeleteContactModal;
