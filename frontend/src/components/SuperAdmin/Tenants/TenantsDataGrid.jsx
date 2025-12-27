import React, { useMemo } from 'react';
import { Box, IconButton, Tooltip, Chip } from '@mui/material';
import { Key, Edit2, Ban, CheckCircle, Trash2 } from 'lucide-react';
import DataGrid from '../../common/DataGrid';
import { formatDate } from './tenantConfig';

const TenantsDataGrid = ({
  tenants,
  loading,
  onCredentials,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  // DataGrid columns definition
  const columns = useMemo(() => [
    {
      field: 'sno',
      headerName: 'S.NO.',
      width: 80,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'name',
      headerName: 'NAME',
      flex: 1,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>{value}</span>
      ),
    },
    {
      field: 'ownerEmail',
      headerName: 'EMAIL',
      flex: 1,
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (
        <span style={{ color: '#6b7280' }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'SLUG',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'STATUS',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            backgroundColor: value ? '#dcfce7' : '#fee2e2',
            color: value ? '#166534' : '#991b1b',
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'CREATED',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{formatDate(value)}</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'ACTIONS',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Tooltip title="Configure Credentials">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCredentials(row);
              }}
              sx={{ color: '#3b82f6' }}
            >
              <Key size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              sx={{ color: '#6b7280' }}
            >
              <Edit2 size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(row);
              }}
              sx={{ color: row.isActive ? '#f97316' : '#22c55e' }}
            >
              {row.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
              sx={{ color: '#ef4444' }}
            >
              <Trash2 size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [onCredentials, onEdit, onToggleStatus, onDelete]);

  // DataGrid rows
  const rows = useMemo(() =>
    tenants.map((tenant, index) => ({
      id: tenant.id || tenant._id,
      sno: index + 1,
      name: tenant.name,
      ownerEmail: tenant.ownerEmail,
      ownerName: tenant.ownerName,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      // Keep full tenant data for actions
      ...tenant,
    })),
  [tenants]);

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      checkboxSelection={false}
      pageSize={25}
      height="calc(100vh - 420px)"
      initialSortField="createdAt"
      initialSortOrder="desc"
      customStyles={{
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f9fafb',
          borderBottom: '2px solid #e5e7eb',
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#f9fafb',
        },
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDataGrid-cellContent': {
          textAlign: 'center',
        },
      }}
    />
  );
};

export default TenantsDataGrid;
