import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Select, MenuItem, TextField, InputAdornment, Switch } from '@mui/material';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import DataGrid from '../common/DataGrid';

const ROLES = ['user', 'admin', 'superadmin'];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SuperAdminUsers = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await apiFetch('/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
      else toast.error('Failed to fetch users');
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (uid, newRole) => {
    try {
      setUpdatingUserId(uid);
      const token = await getToken();
      const res = await apiFetch(`/auth/users/${uid}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role updated');
        fetchUsers();
      } else {
        toast.error('Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (uid, currentStatus) => {
    try {
      setTogglingUserId(uid);
      const token = await getToken();
      const res = await apiFetch(`/auth/users/${uid}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.user.isDisabled ? 'User disabled' : 'User enabled');
        fetchUsers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update status');
    } finally {
      setTogglingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, roleFilter, searchQuery]);

  const columns = useMemo(
    () => [
      {
        field: 'sno',
        headerName: 'S.No.',
        width: 70,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'displayName',
        headerName: 'NAME',
        width: 180,
        headerAlign: 'center',
        renderCell: ({ value, row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, height: '100%', opacity: row.isDisabled ? 0.5 : 1 }}>
            <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
          </Box>
        ),
      },
      {
        field: 'email',
        headerName: 'EMAIL',
        flex: 1,
        minWidth: 220,
        headerAlign: 'center',
        renderCell: ({ value, row }) => (
          <span style={{ opacity: row.isDisabled ? 0.5 : 1 }}>{value}</span>
        ),
      },
      {
        field: 'role',
        headerName: 'ROLE',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ value, row }) => (
          <Select
            value={value || 'user'}
            onChange={(e) => handleRoleChange(row.uid, e.target.value)}
            disabled={updatingUserId === row.uid || row.isDisabled}
            size="small"
            onClick={(e) => e.stopPropagation()}
            sx={{
              minWidth: 100,
              opacity: row.isDisabled ? 0.5 : 1,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
              borderRadius: '6px',
            }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </MenuItem>
            ))}
          </Select>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'CREATED',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ value, row }) => (
          <span style={{ opacity: row.isDisabled ? 0.5 : 1 }}>{formatDate(value)}</span>
        ),
      },
      {
        field: 'actions',
        headerName: 'STATUS',
        width: 130,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              checked={!row.isDisabled}
              onChange={() => handleToggleStatus(row.uid, row.isDisabled)}
              disabled={togglingUserId === row.uid}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#22c55e',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#22c55e',
                },
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: row.isDisabled ? '#ef4444' : '#22c55e',
                minWidth: 50,
              }}
            >
              {row.isDisabled ? 'Disabled' : 'Active'}
            </span>
          </Box>
        ),
      },
    ],
    [updatingUserId, togglingUserId]
  );

  const rows = useMemo(
    () =>
      filteredUsers.map((u, i) => ({
        id: u.id,
        sno: i + 1,
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        isDisabled: u.isDisabled,
        createdAt: u.createdAt,
      })),
    [filteredUsers]
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="small"
            sx={{
              minWidth: 130,
              bgcolor: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
              borderRadius: '8px',
            }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </MenuItem>
            ))}
          </Select>

          <TextField
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} className="text-gray-400" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 220,
              bgcolor: '#fff',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#000' },
                '&.Mui-focused fieldset': { borderColor: '#000' },
              },
            }}
          />
        </div>
      </div>

      {/* Table */}
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        checkboxSelection={false}
        pageSize={25}
        height="calc(100vh - 260px)"
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
        }}
      />
    </div>
  );
};

export default SuperAdminUsers;
