import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCRM } from '../../hooks/useCRM';
import CRMTable from '../CRM/CRMTable';
import DeleteContactModal from '../CRM/DeleteContactModal';
import AddContactModal from '../CRM/AddContactModal';
import ImageViewModal from '../CRM/ImageViewModal';
import EmptyState from '../CRM/EmptyState';
import LoadingState from '../CRM/LoadingState';

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
  } = useCRM();

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, entry: null });
  const [addModal, setAddModal] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: null });

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

  const openImageModal = (imageUrl) => {
    setImageModal({ isOpen: true, imageUrl });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: null });
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
            All contacts extracted from visiting cards ({crmEntries.length} total)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-all shadow-sm font-medium cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add New Contact
        </button>
      </div>

      {crmEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <CRMTable
          entries={crmEntries}
          editingId={editingId}
          editedData={editedData}
          saving={saving}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
          onFieldChange={handleFieldChange}
          onDelete={openDeleteModal}
          onImageClick={openImageModal}
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
