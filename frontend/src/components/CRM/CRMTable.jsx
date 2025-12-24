import React from 'react';
import CRMTableRow from './CRMTableRow';

const CRMTable = ({
  entries,
  editingId,
  editedData,
  saving,
  onEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
  onDelete,
  onImageClick,
  selectedIds = [],
  onSelectChange,
  onSelectAll
}) => {
  const allSelected = entries.length > 0 && selectedIds.length === entries.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < entries.length;

  return (
    <div className="w-full overflow-auto max-h-[calc(100vh-250px)] border border-gray-200 rounded-lg shadow-md bg-white">
      <table className="w-full border-collapse" style={{ minWidth: '2300px' }}>
        <thead className="sticky top-0 z-10 bg-gray-50">
          {/* First Header Row - Main Groups */}
          <tr className="border-b border-gray-300">
            <th rowSpan="2" className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[50px] align-middle">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
              />
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[60px] align-middle">
              S.NO.
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[100px] align-middle">
              IMAGE
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[100px] align-middle">
              STATUS
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[150px] align-middle">
              COMPANY NAME
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[150px] align-middle">
              CONTACT PERSON
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[150px] align-middle">
              DESIGNATION
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[150px] align-middle">
              MOBILE NUMBER
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[120px] align-middle">
              LANDLINE
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-50 w-[200px] align-middle">
              EMAIL
            </th>
            <th colSpan="4" className="px-4 py-2 text-center text-xs font-bold text-blue-800 uppercase tracking-wider border-r border-gray-200 bg-blue-100">
              STATUS
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 w-[180px] align-middle">
              NEXT FOLLOWUP<br/>DATE
            </th>
            <th colSpan="3" className="px-4 py-2 text-center text-xs font-bold text-green-800 uppercase tracking-wider border-r border-gray-200 bg-green-100">
              DEMO DETAILS
            </th>
            <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 w-[100px] align-middle">
              ACTIONS
            </th>
          </tr>

          {/* Second Header Row - Sub Headers */}
          <tr className="border-b-2 border-gray-300">
            <th className="px-4 py-2 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 w-[150px]">
              What
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 w-[150px]">
              Pitch
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 w-[150px]">
              Date
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 w-[180px]">
              Update
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-green-50 w-[150px]">
              Date
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-green-50 w-[150px]">
              Demo done
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-green-50 w-[200px]">
              Comments
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <CRMTableRow
              key={entry._id}
              entry={entry}
              index={index}
              isEditing={editingId === entry._id}
              editedData={editedData}
              saving={saving}
              onEdit={onEdit}
              onCancelEdit={onCancelEdit}
              onSave={onSave}
              onFieldChange={onFieldChange}
              onDelete={onDelete}
              onImageClick={onImageClick}
              isSelected={selectedIds.includes(entry._id)}
              onSelectChange={onSelectChange}
            />
          ))}
        </tbody>
      </table>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default CRMTable;
