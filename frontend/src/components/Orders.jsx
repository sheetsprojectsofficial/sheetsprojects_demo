import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Fade,
  Backdrop
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { apiFetch } from '../utils/api';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [solutionLinkModal, setSolutionLinkModal] = useState({ isOpen: false, orderId: null, currentUrl: '' });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm, user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        search: searchTerm
      });

      const response = await apiFetch(`/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
        setError(null);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      
      const response = await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state
        setOrders(orders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        ));
      } else {
        alert('Failed to update order status: ' + data.message);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const enableSolutionLink = async (orderId, driveUrl) => {
    if (!user || !driveUrl.trim()) return;
    
    try {
      const token = await user.getIdToken();
      
      const response = await apiFetch(`/orders/${orderId}/solution/enable`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driveUrl: driveUrl.trim() })
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state with both solution link and status changes
        setOrders(orders.map(order => 
          order.orderId === orderId 
            ? { 
                ...order, 
                solutionLink: data.order.solutionLink,
                status: data.order.status, // Update status to delivered
                updatedAt: data.order.updatedAt
              }
            : order
        ));
        
        // Also update the book's shareableLink field for future purchases
        const order = orders.find(o => o.orderId === orderId);
        if (order?.itemType === 'book' && order?.bookInfo?.bookId) {
          try {
            await apiFetch(`/books/admin/${order.bookInfo.bookId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                shareableLink: driveUrl.trim()
              })
            });
          } catch (updateError) {
            console.error('Error updating book shareableLink:', updateError);
          }
        }
        
        setSolutionLinkModal({ isOpen: false, orderId: null, currentUrl: '' });
      }
    } catch (err) {
      console.error('Error enabling solution link:', err);
    }
  };

  const disableSolutionLink = async (orderId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await apiFetch(`/orders/${orderId}/solution/disable`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state with both solution link and status changes
        setOrders(orders.map(order =>
          order.orderId === orderId
            ? {
                ...order,
                solutionLink: data.order.solutionLink,
                status: data.order.status, // Update status to pending
                updatedAt: data.order.updatedAt
              }
            : order
        ));
      }
    } catch (err) {
      console.error('Error disabling solution link:', err);
    }
  };

  // Delete order (with cascade delete of BookPurchase for books)
  const deleteOrder = async (orderId, orderItemType) => {
    if (!user) return;

    // Confirm deletion
    const confirmMessage = orderItemType === 'book'
      ? 'Are you sure you want to delete this order? This will also remove the book purchase record for this user.'
      : 'Are you sure you want to delete this order?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await apiFetch(`/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the order from local state
        setOrders(orders.filter(order => order.orderId !== orderId));

        // Show success message
        if (data.cascadeDeleted) {
          alert('Order deleted successfully! Related book purchase has also been removed.');
        } else {
          alert('Order deleted successfully!');
        }
      } else {
        alert('Failed to delete order: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Error deleting order. Please try again.');
    }
  };

  const openSolutionLinkModal = async (orderId, currentUrl = '') => {
    const order = orders.find(o => o.orderId === orderId);
    let finalUrl = currentUrl;
    
    // For books without a current URL, try to fetch the book's shareableLink or construct drive folder link
    if (!finalUrl && order?.itemType === 'book' && order?.bookInfo?.bookId) {
      try {
        const response = await apiFetch(`/books/id/${order.bookInfo.bookId}`);
        const data = await response.json();
        
        if (data.success && data.book) {
          // First try to use the shareableLink
          if (data.book.shareableLink) {
            finalUrl = data.book.shareableLink;
          }
          // If no shareableLink but has driveFolderId, construct folder link
          else if (data.book.driveFolderId) {
            finalUrl = `https://drive.google.com/drive/folders/${data.book.driveFolderId}`;
          }
          // If neither, manual entry will be required
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
    }
    
    // For free books with auto-populated drive links, automatically enable the solution
    if (order?.isFree && order?.itemType === 'book' && finalUrl && finalUrl.trim()) {
      try {
        await enableSolutionLink(orderId, finalUrl.trim());
        const bookTitle = order.bookInfo?.title || 'Book';
        toast.success(`${bookTitle} access enabled! Users can now read the book immediately.`);
        return;
      } catch (error) {
        toast.error('Auto-enable failed. Please try manually.');
      }
    }
    
    setSolutionLinkModal({ isOpen: true, orderId, currentUrl: finalUrl });
  };

  const syncSolutionLinksFromSheets = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const token = await user.getIdToken();
      
      const response = await apiFetch(`/orders/solution/sync-from-sheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the orders list to show updated solution links
        fetchOrders();
        alert(`Successfully synced solution links!\nProducts processed: ${data.details.productsProcessed}\nOrders updated: ${data.details.ordersUpdated}`); // eslint-disable-line no-alert
      } else {
        alert('Failed to sync solution links: ' + data.message);
      }
    } catch (err) {
      console.error('Error syncing solution links:', err);
      alert('Error syncing solution links. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'packed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'out-for-delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, email, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary cursor-pointer"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          
          {/* Sync Solutions Button */}
          <button
            onClick={syncSolutionLinksFromSheets}
            disabled={syncing}
            className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Solutions'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  {/* Order Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                      {order.emailSent && (
                        <div className="text-xs text-green-600">
                          ✓ Email sent
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerInfo.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerInfo.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        📞 {order.customerInfo.phoneNumber}
                      </div>
                      {/* Show address for physical products */}
                      {(order.productInfo?.productType === 'Physical' || order.productInfo?.productType === 'Physical + Soft') && order.customerInfo.address && (
                        <div className="text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                          <div className="font-medium text-blue-900 mb-1">📍 Shipping Address:</div>
                          <div className="text-blue-800">{order.customerInfo.address}</div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Product/Book */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.itemType === 'book' ? order.bookInfo?.title : order.productInfo?.title}
                      </div>
                      {order.itemType === 'book' ? (
                        <div className="text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                            📚 Book
                          </span>
                        </div>
                      ) : (
                        <>
                          {order.productInfo?.summary && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {order.productInfo.summary}
                            </div>
                          )}
                          {order.productInfo?.productType && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.productInfo.productType === 'Physical'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.productInfo.productType === 'Soft'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {order.productInfo.productType === 'Physical' && '📦 Physical'}
                                {order.productInfo.productType === 'Soft' && '💾 Digital'}
                                {order.productInfo.productType === 'Physical + Soft' && '📦💾 Both'}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.isFree ? '₹0' : `₹${order.totalAmount}`}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-3 min-w-[200px]">
                      {/* Status Dropdown */}
                      <div>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                          className={`w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white ${
                            order.solutionLink?.isEnabled
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer'
                          }`}
                          disabled={order.solutionLink?.isEnabled}
                          title={order.solutionLink?.isEnabled ? 'Status is automatically managed by solution access' : 'Change order status'}
                        >
                          {/* For Physical products, show physical delivery statuses */}
                          {(order.productInfo?.productType === 'Physical' || order.productInfo?.productType === 'Physical + Soft') ? (
                            <>
                              <option value="pending">Pending</option>
                              <option value="packed">Packed</option>
                              <option value="shipped">Shipped</option>
                              <option value="out-for-delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">Pending</option>
                              <option value="delivered">Delivered</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Drive Link Management Buttons - Only show for digital products and books */}
                      {(order.itemType === 'book' || order.productInfo?.productType === 'Soft' || order.productInfo?.productType === 'Physical + Soft') && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {order.solutionLink?.isEnabled ? (
                            <>
                              <button
                                onClick={() => disableSolutionLink(order.orderId)}
                                className="flex-1 min-w-fit text-xs bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors cursor-pointer font-medium"
                                title={order.itemType === 'book' ? "Disable book access" : "Disable solution access"}
                              >
                                Disable {order.itemType === 'book' ? 'Book' : 'Solution'}
                              </button>
                              <button
                                onClick={() => openSolutionLinkModal(order.orderId, order.solutionLink?.driveUrl || '')}
                                className="flex-1 min-w-fit text-xs bg-blue-100 text-brand-primary px-3 py-2 rounded-md hover:bg-blue-200 transition-colors cursor-pointer font-medium"
                                title="Edit drive link"
                              >
                                Edit Link
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openSolutionLinkModal(order.orderId, order.solutionLink?.driveUrl || '')}
                              className="w-full text-xs bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 transition-colors cursor-pointer font-medium"
                              title={
                                order.itemType === 'book'
                                  ? (order.isFree ? "Auto-enable book access (free book)" : "Enable book access")
                                  : "Enable solution access"
                              }
                            >
                              {order.itemType === 'book'
                                ? (order.isFree ? 'Auto-Enable Book' : 'Enable Book')
                                : 'Enable Solution'
                              }
                            </button>
                          )}
                        </div>
                      )}

                      {/* Delete Order Button */}
                      <button
                        onClick={() => deleteOrder(order.orderId, order.itemType)}
                        className="w-full text-xs bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer font-medium"
                        title={order.itemType === 'book' ? "Delete order and book purchase" : "Delete order"}
                      >
                        🗑️ Delete Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">No orders match your current filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Clean Professional Modal */}
      <Modal
        open={solutionLinkModal.isOpen}
        onClose={() => setSolutionLinkModal({ isOpen: false, orderId: null, currentUrl: '' })}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { bgcolor: 'rgba(0, 0, 0, 0.5)' }
          },
        }}
      >
        <Fade in={solutionLinkModal.isOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 480 },
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              p: 0,
              outline: 'none',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Clean Header */}
            <Box
              sx={{
                bgcolor: 'white',
                borderBottom: '1px solid #e5e7eb',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                  {solutionLinkModal.currentUrl ? 'Edit Solution Link' : 'Enable Solution Access'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {solutionLinkModal.currentUrl ? 'Update the Google Drive link' : 'Add Google Drive link to enable access'}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setSolutionLinkModal({ isOpen: false, orderId: null, currentUrl: '' })}
                sx={{ 
                  color: '#6b7280', 
                  '&:hover': { 
                    bgcolor: '#f3f4f6',
                    color: '#111827'
                  } 
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Modal Content */}
            <Box sx={{ p: 3 }}>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const driveUrl = formData.get('driveUrl');
                  enableSolutionLink(solutionLinkModal.orderId, driveUrl);
                }}
              >
                {/* URL Input */}
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#111827',
                      fontSize: 14,
                      mb: 1.5
                    }}
                  >
                    Google Drive Share Link
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      name="driveUrl"
                      type="url"
                      fullWidth
                      required
                      defaultValue={solutionLinkModal.currentUrl}
                      placeholder="https://drive.google.com/file/d/..."
                      variant="outlined"
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          bgcolor: '#f9fafb',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: 'var(--brand-primary)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'var(--brand-primary)',
                            borderWidth: 2,
                          },
                          '&.Mui-focused': {
                            bgcolor: 'white',
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: 14,
                          py: 1.5,
                        }
                      }}
                    />
                    {solutionLinkModal.currentUrl && (
                      <IconButton
                        onClick={() => window.open(solutionLinkModal.currentUrl, '_blank')}
                        size="small"
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'var(--brand-primary)',
                          color: 'white',
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'color-mix(in srgb, var(--brand-primary) 85%, black)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 8px color-mix(in srgb, var(--brand-primary) 25%, transparent)',
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15,3 21,3 21,9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: '#6b7280', 
                    fontSize: 12,
                    mt: 1,
                    display: 'block',
                    lineHeight: 1.4
                  }}>
                    For books: Go to <strong>Google Drive → sheetsprojects-store → Books</strong>, find the book folder, right-click → Share → Copy link. Make sure the link is publicly accessible.
                  </Typography>
                </Box>

                {/* Sample Format */}
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: '#f9fafb', 
                  borderRadius: 1, 
                  border: '1px solid #e5e7eb'
                }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 1,
                    fontSize: 11
                  }}>
                    Expected Format:
                  </Typography>
                  <Box sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: 11, 
                    color: '#374151',
                    wordBreak: 'break-all',
                    bgcolor: 'white',
                    p: 1.5,
                    borderRadius: 0.5,
                    border: '1px solid #e5e7eb'
                  }}>
                    https://drive.google.com/file/d/[FILE_ID]/view?usp=sharing
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setSolutionLinkModal({ isOpen: false, orderId: null, currentUrl: '' })}
                    sx={{ 
                      borderRadius: 1,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: 14,
                      color: '#6b7280',
                      borderColor: 'color-mix(in srgb, var(--brand-primary) 30%, #e5e7eb)',
                      '&:hover': {
                        borderColor: 'color-mix(in srgb, var(--brand-primary) 50%, #9ca3af)',
                        bgcolor: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      borderRadius: 1,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: 14,
                      bgcolor: 'var(--brand-primary)',
                      color: 'white',
                      boxShadow: '0 1px 2px 0 color-mix(in srgb, var(--brand-primary) 20%, transparent)',
                      '&:hover': {
                        bgcolor: 'color-mix(in srgb, var(--brand-primary) 85%, black)',
                        boxShadow: '0 4px 6px -1px color-mix(in srgb, var(--brand-primary) 30%, transparent)',
                      },
                    }}
                  >
                    {solutionLinkModal.currentUrl ? 'Update' : 'Enable'} Solution
                  </Button>
                </Box>
              </form>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

export default Orders;