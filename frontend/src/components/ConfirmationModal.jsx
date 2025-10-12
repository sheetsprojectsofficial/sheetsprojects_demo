import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Warning, Close } from '@mui/icons-material';
import { useBrand } from '../context/BrandContext';
import { useTheme } from '../hooks/useTheme';

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "error",
  loading = false,
  icon
}) => {
  const { brandColors } = useBrand();
  const { getThemeStyles } = useTheme();
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
          border: `2px solid ${brandColors.primary}`,
          boxShadow: `0 10px 25px rgba(${brandColors.primaryRgb}, 0.15)`
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: brandColors.primary,
            '&:hover': {
              backgroundColor: `rgba(${brandColors.primaryRgb}, 0.1)`,
              color: brandColors.primary
            }
          }}
        >
          <Close />
        </IconButton>

        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          {icon || <Warning sx={{ fontSize: 48, color: brandColors.primary, mb: 2 }} />}
          
          <Typography
            variant="h6"
            component="h2"
            sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
          >
            {title}
          </Typography>
          
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 3 }}
          >
            {message}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'center' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              minWidth: 100,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: brandColors.primary,
              color: brandColors.primary,
              '&:hover': {
                borderColor: brandColors.primary,
                backgroundColor: `rgba(${brandColors.primaryRgb}, 0.1)`
              }
            }}
          >
            {cancelText}
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant="contained"
            sx={{
              minWidth: 100,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: brandColors.primary,
              color: brandColors.secondary,
              '&:hover': {
                backgroundColor: `rgba(${brandColors.primaryRgb}, 0.8)`,
                boxShadow: `0 5px 15px rgba(${brandColors.primaryRgb}, 0.3)`
              },
              '&:disabled': {
                backgroundColor: `rgba(${brandColors.primaryRgb}, 0.6)`,
                color: brandColors.secondary
              }
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ConfirmationModal;