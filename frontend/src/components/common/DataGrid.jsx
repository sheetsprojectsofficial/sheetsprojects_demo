import React from 'react';
import { DataGrid as MuiDataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const DataGrid = ({
  rows = [],
  columns = [],
  loading = false,
  checkboxSelection = true,
  disableRowSelectionOnClick = true,
  selectedIds = [],
  onSelectionChange,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  height = 'calc(100vh - 280px)',
  initialSortField = null,
  initialSortOrder = 'asc',
  customStyles = {},
  onRowClick,
  getRowClassName,
  ...otherProps
}) => {
  const defaultStyles = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    '& .MuiDataGrid-cell': {
      borderRight: '1px solid #e5e7eb',
      fontSize: '0.875rem',
    },
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#f9fafb',
      borderBottom: '2px solid #d1d5db',
      fontWeight: 600,
      fontSize: '0.75rem',
      color: '#4b5563',
      textTransform: 'uppercase',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 600,
    },
    '& .MuiDataGrid-row': {
      '&:hover': {
        backgroundColor: '#f9fafb',
      },
      '&.Mui-selected': {
        backgroundColor: '#f3e8ff',
        '&:hover': {
          backgroundColor: '#e9d5ff',
        },
      },
      '&.row-status-hot': {
        backgroundColor: '#fecaca',
        '&:hover': {
          backgroundColor: '#fca5a5',
        },
      },
      '&.row-status-cold': {
        backgroundColor: '#fed7aa',
        '&:hover': {
          backgroundColor: '#fdba74',
        },
      },
      '&.row-status-dead': {
        backgroundColor: '#e5e7eb',
        '&:hover': {
          backgroundColor: '#d1d5db',
        },
      },
      '&.row-status-converted': {
        backgroundColor: '#bbf7d0',
        '&:hover': {
          backgroundColor: '#86efac',
        },
      },
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: '2px solid #d1d5db',
      backgroundColor: '#f9fafb',
    },
    '& .MuiCheckbox-root': {
      color: '#9333ea',
      '&.Mui-checked': {
        color: '#9333ea',
      },
    },
    '& .MuiDataGrid-virtualScroller': {
      overflowX: 'auto',
    },
    ...customStyles,
  };

  const initialState = {
    pagination: {
      paginationModel: { pageSize, page: 0 },
    },
  };

  if (initialSortField) {
    initialState.sorting = {
      sortModel: [{ field: initialSortField, sort: initialSortOrder }],
    };
  }

  // Ensure rows is always an array
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  return (
    <Box sx={{ height, width: '100%' }}>
      <MuiDataGrid
        rows={safeRows}
        columns={safeColumns}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        loading={loading}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={onSelectionChange}
        onRowClick={onRowClick}
        initialState={initialState}
        pageSizeOptions={pageSizeOptions}
        paginationMode="client"
        sx={defaultStyles}
        getRowClassName={getRowClassName}
        {...otherProps}
      />
    </Box>
  );
};

export default DataGrid;
