import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { apiFetch } from '../utils/api';

const AdminBooks = () => {
  const { user, getToken } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('all');

  // Fetch books from API
  const fetchBooks = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const token = await getToken();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await apiFetch(`/books/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setBooks(data.books);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch books: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch book stats
  const fetchStats = async () => {
    try {
      const token = await getToken();
      const response = await apiFetch('/books/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch book stats: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching book stats:', error);
      toast.error('Failed to fetch book stats: ' + error.message);
    }
  };

  // Sync books from Google Drive
  const syncFromDrive = async () => {
    try {
      setSyncing(true);
      const token = await getToken();

      const response = await apiFetch('/books/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Show detailed sync results
        const { created, updated, deleted, errors } = data.syncResults;
        let message = `Sync completed! Created: ${created}, Updated: ${updated}`;
        if (deleted > 0) message += `, Deleted: ${deleted}`;
        
        if (errors && errors.length > 0) {
          toast.warning(`${message}. ${errors.length} books failed`);
          
          // Show specific error for duplicate slugs
          const duplicateErrors = errors.filter(e => e.error.includes('duplicate key'));
          if (duplicateErrors.length > 0) {
            toast.error(`${duplicateErrors.length} books failed due to duplicate slugs. Backend needs slug generation fix.`);
          }
        } else {
          toast.success(message);
        }
        
        // Reset to first page to see all books
        setCurrentPage(1);
        fetchBooks(1, filter);
        fetchStats();
      } else {
        toast.error('Sync failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error syncing books:', error);
      toast.error('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Delete book
  const deleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const token = await getToken();
      const response = await apiFetch(`/books/admin/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Book deleted successfully');
        fetchBooks(currentPage, filter);
        fetchStats();
      } else {
        toast.error('Delete failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Delete failed: ' + error.message);
    }
  };

  // Update book
  const updateBook = async (bookId, updateData) => {
    try {
      const token = await getToken();
      const response = await apiFetch(`/books/admin/${bookId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Book updated successfully');
        fetchBooks(currentPage, filter);
        fetchStats();
      } else {
        toast.error('Update failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('Update failed: ' + error.message);
    }
  };

  // Handle price change
  const handlePriceChange = (bookId, newPrice, isPaid) => {
    const price = parseFloat(newPrice) || 0;
    updateBook(bookId, { price, isPaid });
  };

  // Handle status change
  const handleStatusChange = (bookId, status) => {
    updateBook(bookId, { status });
  };

  // Handle paid/free toggle
  const handlePaidToggle = (bookId, isPaid) => {
    const price = isPaid ? 10 : 0; // Default price for paid books
    updateBook(bookId, { isPaid, price });
  };

  useEffect(() => {
    if (user) {
      fetchBooks(currentPage, filter);
      fetchStats();
    }
  }, [user, currentPage, filter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price, currency = 'USD') => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Management</h1>
            <p className="text-gray-600 mt-1">Manage books synced from Google Drive</p>
          </div>
          <button
            onClick={syncFromDrive}
            disabled={syncing}
            className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync from Drive
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Books</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.published || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid Books</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.paid || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Purchases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPurchases || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="all">All Books</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
            <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
              Filter: {filter} | Total API: {pagination.total || 0}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
                fetchBooks(1, 'all');
              }}
              disabled={loading}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 cursor-pointer"
            >
              Show All
            </button>
            <button
              onClick={() => fetchBooks(currentPage, filter)}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Books</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-2 bg-gray-50 text-sm text-gray-600">
                Showing {books.length} books {pagination.total ? `of ${pagination.total} total` : ''}
              </div>
              {books.length > 0 ? (
                books.map((book) => (
                  <div key={book._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4 flex-1">
                        {/* Cover Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={book.coverImage.startsWith('/api/') ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${book.coverImage}` : book.coverImage}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate mr-3">
                              {book.title}
                            </h4>
                            <span className={getStatusBadge(book.status)}>
                              {book.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {book.excerpt}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>📁 {book.driveFolderName}</span>
                            <span>📅 {formatDate(book.createdAt)}</span>
                            <span>👀 {book.views} views</span>
                            <span>❤️ {book.likes} likes</span>
                            <span>🛒 {book.purchaseCount || 0} purchases</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Price Management */}
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={book.isPaid}
                              onChange={(e) => handlePaidToggle(book._id, e.target.checked)}
                              className="mr-1"
                            />
                            <span className="text-xs text-gray-600">Paid</span>
                          </label>
                          {book.isPaid && (
                            <input
                              type="number"
                              value={book.price}
                              onChange={(e) => handlePriceChange(book._id, e.target.value, true)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                              min="0"
                              step="0.01"
                            />
                          )}
                        </div>

                        {/* Status Change */}
                        <select
                          value={book.status}
                          onChange={(e) => handleStatusChange(book._id, e.target.value)}
                          className="px-2 py-1 text-xs border cursor-pointer border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>

                        <a
                          href={`/books/${book.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-xs text-brand-primary bg-blue-50 rounded hover:bg-blue-100 cursor-pointer"
                        >
                          View
                        </a>
                        <button
                          onClick={() => deleteBook(book._id)}
                          className="px-3 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No books found. Try syncing from Google Drive.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBooks;