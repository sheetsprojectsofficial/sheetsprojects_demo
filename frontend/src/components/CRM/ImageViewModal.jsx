import React from 'react';
import { Modal, Box, IconButton } from '@mui/material';
import { X } from 'lucide-react';

const ImageViewModal = ({ isOpen, imageUrl, onClose }) => {
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    borderRadius: '12px',
    boxShadow: 24,
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="visiting-card-image"
      aria-describedby="view-visiting-card-full-size"
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <Box sx={modalStyle}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-900">
            Visiting Card Image
          </h3>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'gray.400',
              '&:hover': {
                backgroundColor: 'white',
                color: 'gray.600'
              }
            }}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Modal Content - Image Display */}
        <div className="p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
          <img
            src={imageUrl}
            alt="Visiting card - Full view"
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl border-2 border-white"
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ImageViewModal;
