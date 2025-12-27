import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const Books = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBooks, setAllBooks] = useState([]); // Store all books
  const [books, setBooks] = useState([]);        // Store filtered books
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // Local search state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    isPaid: searchParams.get('isPaid') || '',
    page: parseInt(searchParams.get('page')) || 1
  });
  const [userId, setUserId] = useState(null);

  // Get or create user session ID
  const getUserId = () => {
    let storedUserId = localStorage.getItem('blogUserId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('blogUserId', storedUserId);
    }
    return storedUserId;
  };

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  // Fetch all books (without search filter)
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '50' // Get more books for client-side filtering
      });

      // Don't include search in API call - we'll filter client-side
      if (filters.category) params.append('category', filters.category);
      if (filters.isPaid) params.append('isPaid', filters.isPaid);
      if (userId) params.append('userId', userId);

      const response = await apiFetch(`/books?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAllBooks(data.books);
        setBooks(data.books); // Initially show all books
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await apiFetch('/books/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBooks();
    }
  }, [filters, userId]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.isPaid) params.set('isPaid', filters.isPaid);
    if (filters.page > 1) params.set('page', filters.page.toString());
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Client-side search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setBooks(allBooks);
    } else {
      const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setBooks(filtered);
    }
  }, [searchQuery, allBooks]);

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      setSearchQuery(value);
      return; // Don't update filters for search - handle client-side
    }
    
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  };

  const handleBookClick = (slug) => {
    navigate(`/books/${slug}`);
  };

  const handleLikeBook = async (bookId, isLiked) => {
    if (!userId) return;
    
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await apiFetch(`/books/${bookId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the book in the list
        setBooks(prev => prev.map(book => 
          book._id === bookId 
            ? { ...book, likes: data.likes, isLiked: !isLiked }
            : book
        ));
      }
    } catch (error) {
      console.error('Error updating book like:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="aspect-[3/4] bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Books</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchBooks}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Search */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Books</h1>
              <p className="text-gray-600">Discover our collection of books and expand your knowledge</p>
            </div>
            
            {/* Search in top right */}
            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
            </div>
          </div>


          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <div key={book._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  {/* Book Cover */}
                  <div 
                    className="aspect-[3/4] overflow-hidden bg-gray-100 cursor-pointer"
                    onClick={() => handleBookClick(book.slug)}
                  >
                    {console.log('Book cover image data:', book.title, book.coverImage)}

<img
  src={(() => {
    console.log('Processing image for:', book.title, 'Raw coverImage:', book.coverImage);
    
    // Handle different image URL types
    if (book.coverImage.startsWith('http://') || book.coverImage.startsWith('https://')) {
      console.log('Using direct URL:', book.coverImage);
      return book.coverImage;
    } else if (book.coverImage.startsWith('/api/images/drive/')) {
      const fileId = book.coverImage.replace('/api/images/drive/', '');
      const googleUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log('Converted to Google Drive URL:', googleUrl);
      return googleUrl;
    } else if (book.coverImage.startsWith('/api/')) {
      const backendUrl = `${import.meta.env.VITE_API_URL}${book.coverImage}`;
      console.log('Using backend API URL:', backendUrl);
      return backendUrl;
    } else {
      // If it's just a file ID, create the Google Drive URL
      const googleUrl = `https://drive.google.com/uc?export=view&id=${book.coverImage}`;
      console.log('Treating as file ID, Google Drive URL:', googleUrl);
      return googleUrl;
    }
  })()}
  alt={book.title}
  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
  referrerPolicy="no-referrer"
  onError={(e) => {
    console.error('Image failed to load:', book.title, book.coverImage);
    console.error('Failed URL was:', e.target.src);
    e.target.src = '/default-book-cover.jpg'; // Fallback image
  }}
/>
                  </div>

                  {/* Book Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block bg-blue-100 text-brand-primary text-xs font-semibold px-2 py-1 rounded-full">
                        {book.category}
                      </span>
                      <span className={`text-sm font-semibold ${book.isPaid ? 'text-green-600' : 'text-brand-primary'}`}>
                        {formatPrice(book.price, book.currency)}
                      </span>
                    </div>

                    <h3 
                      className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-brand-primary"
                      onClick={() => handleBookClick(book.slug)}
                    >
                      {book.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {book.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {book.author}</span>
                      <span>{formatDate(book.createdAt)}</span>
                    </div>

                    {/* Pricing Information */}
                    {book.pricingInfo && book.bookSettings && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="space-y-1 text-xs text-gray-500">
                          {/* Language */}
                          {book.bookSettings.language && (
                            <div className="flex justify-between">
                              <span className="font-medium">Language:</span>
                              <span>{book.bookSettings.language === 'NULL' ? 'Language - NULL' : book.bookSettings.language}</span>
                            </div>
                          )}

                          {/* Release Date */}
                          {book.bookSettings['release date'] && (
                            <div className="flex justify-between">
                              <span className="font-medium">Release:</span>
                              <span>{book.bookSettings['release date'] === 'NULL' ? 'Release Date - NULL' : book.bookSettings['release date']}</span>
                            </div>
                          )}
                          
                          {/* Soft Copy (Always available) */}
                          {/* <div className="flex justify-between">
                            <span className="font-medium">Soft Copy:</span> 
                            <span className="text-blue-600 font-medium">
                              {book.pricingInfo.softCopy ? book.pricingInfo.softCopy.displayText : 'Available'}
                            </span>
                          </div> */}
                          
                          {/* Hard Copy Availability */}
                          {/* <div className="flex justify-between">
                            <span className="font-medium">Hard Copy:</span> 
                            <span className={book.pricingInfo.hardCopy && book.pricingInfo.hardCopy.available ? 'text-green-600' : 'text-red-500'}>
                              {book.pricingInfo.hardCopy ? book.pricingInfo.hardCopy.availabilityText : 'Not Available'}
                            </span>
                          </div> */}
                          
                          {/* Hard Copy Price (Only if available) */}
                          {/* {book.pricingInfo.hardCopy && book.pricingInfo.hardCopy.available && (
                            <div className="flex justify-between">
                              <span className="font-medium">Hard Copy Price:</span> 
                              <span className="text-green-600 font-medium">
                                {book.pricingInfo.hardCopy.displayText}
                              </span>
                            </div>
                          )} */}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
                      {/* <div className="flex items-center space-x-4">
                        <span className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {book.views}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeBook(book._id, book.isLiked);
                          }}
                          className="flex items-center text-sm hover:text-red-500 transition-colors duration-300 cursor-pointer"
                        >
                          <svg 
                            className={`w-4 h-4 mr-1 transition-colors duration-300 ${
                              book.isLiked 
                                ? 'fill-red-500 text-red-500' 
                                : 'fill-none text-gray-500'
                            }`}
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {book.likes}
                        </button>
                      </div> */}

                      <button
                        onClick={() => handleBookClick(book.slug)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-300 cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Books Found</h3>
                <p className="text-gray-500">
                  {filters.search || filters.category || filters.isPaid
                    ? "Try adjusting your filters to see more books."
                    : "Check back later for new books."}
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors duration-300 cursor-pointer ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;