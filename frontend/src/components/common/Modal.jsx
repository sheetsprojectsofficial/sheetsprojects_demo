import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box
} from '@mui/material';
import { X } from 'lucide-react';

const Modal = ({
  open = false,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true,
  disableBackdropClick = false,
  showCloseButton = true,
  ...otherProps
}) => {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      {...otherProps}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e7eb',
            pb: 2,
          }}
        >
          <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {title}
          </Box>
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
              }}
            >
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent
        sx={{
          pt: 3,
          pb: 2,
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            borderTop: '1px solid #e5e7eb',
            px: 3,
            py: 2,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;
