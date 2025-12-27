import React from 'react';
import { TextField, InputAdornment, Select, MenuItem } from '@mui/material';
import { Search } from 'lucide-react';

const TenantSearchFilter = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <TextField
        placeholder="Search by name, email, or slug..."
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
          minWidth: 280,
          flex: 1,
          bgcolor: '#fff',
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': { borderColor: '#e5e7eb' },
            '&:hover fieldset': { borderColor: '#000' },
            '&.Mui-focused fieldset': { borderColor: '#000' },
          },
        }}
      />
      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        size="small"
        sx={{
          minWidth: 150,
          bgcolor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
          borderRadius: '8px',
        }}
      >
        <MenuItem value="all">All Status</MenuItem>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </Select>
    </div>
  );
};

export default TenantSearchFilter;
