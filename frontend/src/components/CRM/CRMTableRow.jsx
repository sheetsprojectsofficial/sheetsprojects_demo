import React from 'react';
import { Pencil, Trash2, Check, X, Image } from 'lucide-react';

const CRMTableRow = ({
  entry,
  index,
  isEditing,
  editedData,
  saving,
  onEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
  onDelete,
  onImageClick,
  isSelected,
  onSelectChange
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get today's date in YYYY-MM-DD format for min date restriction
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const cellClass = "px-4 py-3 border-r border-gray-200 whitespace-nowrap text-center align-middle";
  const editableCellClass = "cursor-pointer text-blue-600 hover:underline";
  const inputClass = "w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-center";
  const textareaClass = "w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[60px]";

  // Get row background color based on status
  const getRowBgClass = () => {
    if (isEditing) return 'bg-gray-100';
    if (isSelected) return 'bg-purple-50';

    const status = entry.leadStatus?.toLowerCase();
    switch (status) {
      case 'hot':
        return 'bg-red-100 hover:bg-red-200';
      case 'cold':
        return 'bg-orange-100 hover:bg-orange-200';
      case 'dead':
        return 'bg-gray-200 hover:bg-gray-300';
      case 'converted':
        return 'bg-green-100 hover:bg-green-200';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  // Get status badge styles
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'bg-red-500 text-white';
      case 'cold':
        return 'bg-orange-500 text-white';
      case 'dead':
        return 'bg-gray-500 text-white';
      case 'converted':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const rowClass = getRowBgClass();

  return (
    <tr className={`border-b border-gray-200 transition-colors ${rowClass}`}>
      {/* Checkbox */}
      <td className="px-3 py-3 border-r border-gray-200 text-center align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange && onSelectChange(entry._id, e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
        />
      </td>
      {/* S.No. */}
      <td className={cellClass}>{index + 1}</td>

      {/* Card Image */}
      <td className={cellClass}>
        {entry.cardImageUrl ? (
          <img
            src={entry.cardImageUrl}
            alt="Visiting card"
            className="w-20 h-12 rounded object-cover cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => onImageClick(entry.cardImageUrl)}
          />
        ) : (
          <div className="w-20 h-12 rounded bg-gray-100 text-gray-400 flex items-center justify-center">
            <Image size={20} />
          </div>
        )}
      </td>

      {/* Lead Status */}
      <td className={cellClass}>
        {isEditing ? (
          <select
            value={editedData.leadStatus || ''}
            onChange={(e) => onFieldChange('leadStatus', e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Select Status</option>
            <option value="Hot">Hot</option>
            <option value="Cold">Cold</option>
            <option value="Dead">Dead</option>
            <option value="Converted">Converted</option>
          </select>
        ) : (
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${getStatusBadgeClass(entry.leadStatus)}`}
            onClick={() => onEdit(entry)}
          >
            {entry.leadStatus || 'N/A'}
          </span>
        )}
      </td>

      {/* Company Name */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.companyName}
            onChange={(e) => onFieldChange('companyName', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.companyName}
          </span>
        )}
      </td>

      {/* Contact Person */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.contactPerson}
            onChange={(e) => onFieldChange('contactPerson', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.contactPerson}
          </span>
        )}
      </td>

      {/* Designation */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.designation}
            onChange={(e) => onFieldChange('designation', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.designation}
          </span>
        )}
      </td>

      {/* Mobile Number */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.mobileNumber}
            onChange={(e) => onFieldChange('mobileNumber', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.mobileNumber}
          </span>
        )}
      </td>

      {/* Landline */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.landline}
            onChange={(e) => onFieldChange('landline', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.landline}
          </span>
        )}
      </td>

      {/* Email */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="email"
            value={editedData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className={inputClass}
          />
        ) : (
          <a
            href={`mailto:${entry.email}`}
            className="text-blue-600 no-underline cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault();
              onEdit(entry);
            }}
          >
            {entry.email}
          </a>
        )}
      </td>

      {/* What */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.what || ''}
            onChange={(e) => onFieldChange('what', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.what || 'N/A'}
          </span>
        )}
      </td>

      {/* Pitch */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.pitch || ''}
            onChange={(e) => onFieldChange('pitch', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.pitch || 'N/A'}
          </span>
        )}
      </td>

      {/* Status Date */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="date"
            value={editedData.statusDate ? formatDate(editedData.statusDate) : ''}
            onChange={(e) => onFieldChange('statusDate', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.statusDate ? formatDate(entry.statusDate) : 'N/A'}
          </span>
        )}
      </td>

      {/* Status Update */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.statusUpdate || ''}
            onChange={(e) => onFieldChange('statusUpdate', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.statusUpdate || 'N/A'}
          </span>
        )}
      </td>

      {/* Next Followup Date */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="date"
            value={editedData.nextFollowupDate ? formatDate(editedData.nextFollowupDate) : ''}
            onChange={(e) => onFieldChange('nextFollowupDate', e.target.value)}
            min={getTodayDate()}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.nextFollowupDate ? formatDate(entry.nextFollowupDate) : 'N/A'}
          </span>
        )}
      </td>

      {/* Demo Date */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="date"
            value={editedData.demoDate ? formatDate(editedData.demoDate) : ''}
            onChange={(e) => onFieldChange('demoDate', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.demoDate ? formatDate(entry.demoDate) : 'N/A'}
          </span>
        )}
      </td>

      {/* Demo Done */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editedData.demoDone || ''}
            onChange={(e) => onFieldChange('demoDone', e.target.value)}
            className={inputClass}
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.demoDone || 'N/A'}
          </span>
        )}
      </td>

      {/* Comments */}
      <td className={cellClass}>
        {isEditing ? (
          <textarea
            value={editedData.comments || ''}
            onChange={(e) => onFieldChange('comments', e.target.value)}
            className={textareaClass}
            rows="2"
          />
        ) : (
          <span
            className={editableCellClass}
            onClick={() => onEdit(entry)}
          >
            {entry.comments || 'N/A'}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(entry._id)}
                disabled={saving}
                className="p-1.5 border-none rounded cursor-pointer inline-flex items-center justify-center transition-colors bg-transparent text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save changes"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={16} />
                )}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={saving}
                className="p-1.5 border-none rounded cursor-pointer inline-flex items-center justify-center transition-colors bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(entry)}
                className="p-1.5 border-none rounded cursor-pointer inline-flex items-center justify-center transition-colors bg-transparent text-blue-600 hover:bg-blue-50"
                title="Edit contact"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(entry)}
                className="p-1.5 border-none rounded cursor-pointer inline-flex items-center justify-center transition-colors bg-transparent text-red-600 hover:bg-red-50"
                title="Delete contact"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default CRMTableRow;
