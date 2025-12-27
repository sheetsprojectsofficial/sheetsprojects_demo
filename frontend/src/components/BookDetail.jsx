import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import Comments from './Comments';
import { Modal, Box, IconButton, Fade, Backdrop } from '@mui/material';
import { Close as CloseIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { apiFetch } from '../utils/api';

const BookDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('soft');

  // Load saved format selection for this book
  useEffect(() => {
    if (book?._id) {
      const savedFormat = localStorage.getItem(`book-format-${book._id}`);
      if (savedFormat && (savedFormat === 'soft' || savedFormat === 'hard')) {
        setSelectedFormat(savedFormat);
      }
    }
  }, [book?._id]);

  // Get or create user session ID
  const getUserId = () => {
    let storedUserId = localStorage.getItem('blogUserId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('blogUserId', storedUserId);
    }
    return storedUserId;
  };

  // Initialize user ID and fetch book detail
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchBookDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get or create user ID
        const id = getUserId();
        if (isMounted) {
          setUserId(id);
        }
        
        const params = new URLSearchParams();
        // Use authenticated user ID for purchase status, fallback to local userId for likes
        const userIdForCheck = isAuthenticated && user ? user.uid : id;
        if (userIdForCheck) params.append('userId', userIdForCheck);
        
        const response = await apiFetch(`/books/${slug}?${params}`, {
          signal: abortController.signal
        });
        const data = await response.json();
        
        if (isMounted && data.success) {
          setBook(data.book);
          setRelatedBooks(data.relatedBooks || []);
          
          // Check if current user has liked this book
          if (id && data.book.likedBy && data.book.likedBy.includes(id)) {
            setIsLiked(true);
          }
          
          // If we have few related books, fetch more
          if ((data.relatedBooks || []).length < 5) {
            fetchAllBooksExceptCurrent(data.book._id, data.book.slug);
          }
        } else if (isMounted && !data.success) {
          setError('Book not found');
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Error fetching book detail:', error);
          setError('Failed to load book');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchBookDetail();
    }
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [slug, isAuthenticated, user]); // Only depend on slug and auth state, not userId

  // Fetch user's purchase information to get Drive link
  const fetchPurchaseInfo = async () => {
    if (!isAuthenticated || !user || !book?.isPurchased) return;
    
    try {
      const token = await user.getIdToken();
      const response = await apiFetch('/orders/my-purchases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Find purchase for this specific book
        const bookPurchase = data.purchases.find(purchase =>
          purchase.itemType === 'book' &&
          purchase.bookInfo?.slug === book.slug
        );

        if (bookPurchase) {
          setPurchaseInfo(bookPurchase);
        }
      }
    } catch (error) {
      console.error('Error fetching purchase info:', error);
    }
  };

  // Fetch purchase info when book data changes and user owns the book
  useEffect(() => {
    if (book?.isPurchased && isAuthenticated && user) {
      fetchPurchaseInfo();
    }
  }, [book?.isPurchased, isAuthenticated, user, book?.slug]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const handleRelatedBookClick = (relatedSlug) => {
    navigate(`/books/${relatedSlug}`);
  };

  // Handle book like/unlike
  const handleLike = async () => {
    if (!userId) {
      console.error('User ID not available');
      return;
    }
    
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      
      const response = await apiFetch(`/books/${book._id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(!isLiked);
        setBook(prev => ({ ...prev, likes: data.likes }));
      }
    } catch (error) {
      console.error('Error updating book like:', error);
    }
  };

  // Handle book purchase - navigate to checkout
  const handlePurchase = () => {
    if (selectedFormat === 'hard' && book.pricingInfo?.hardCopy?.available) {
      // For hardcopy purchases, pass format parameter
      navigate(`/checkout/book-${book._id}?format=hard`);
    } else {
      // For softcopy purchases (default)
      navigate(`/checkout/book-${book._id}`);
    }
  };

  // Handle format selection change
  const handleFormatChange = (event) => {
    const newFormat = event.target.value;
    setSelectedFormat(newFormat);
    // Save format selection to localStorage for this specific book
    if (book?._id) {
      localStorage.setItem(`book-format-${book._id}`, newFormat);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.warning('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart('book', book._id, { bookFormat: selectedFormat });
      toast.success(`Book added to cart (${selectedFormat === 'hard' ? 'Hard Copy' : 'Soft Copy'})!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleReadBook = async () => {
    if (!book.isPurchased) {
      toast.error('You need to purchase this book to read it');
      return;
    }

    // Fetch fresh purchase info directly to get latest data
    if (!isAuthenticated || !user) {
      toast.error('Please log in to read the book');
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const response = await apiFetch('/orders/my-purchases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Find purchase for this specific book
        const bookPurchase = data.purchases.find(purchase =>
          purchase.itemType === 'book' &&
          purchase.bookInfo?.slug === book.slug
        );

        if (bookPurchase?.solutionLink?.isEnabled && bookPurchase?.solutionLink?.driveUrl) {
          // Navigate to reader page with the latest data
          navigate(`/books/${book.slug}/read`);
        } else if (bookPurchase?.solutionLink?.isEnabled && !bookPurchase?.solutionLink?.driveUrl) {
          toast.info('Book access is being configured. Please try again in a moment.');
        } else if (bookPurchase && !bookPurchase.solutionLink?.isEnabled) {
          toast.info('Your book access is being processed. Please check back later.');
        } else {
          toast.error('Book content is not yet available. Please contact support.');
        }
      } else {
        toast.error('Unable to verify book access. Please try again.');
      }
    } catch (error) {
      console.error('Error checking book access:', error);
      toast.error('Unable to access book content. Please try again.');
    }
  };

  // Handle share functionality
  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const getShareableLink = () => {
    return `${window.location.origin}/books/${book.slug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink());
      toast.success('Link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = getShareableLink();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
    }
  };

  // Carousel functions
  const booksPerSlide = 4; // Show 4 books at a time on desktop
  const totalSlides = Math.ceil(relatedBooks.length / booksPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getVisibleBooks = () => {
    const startIndex = currentSlide * booksPerSlide;
    return relatedBooks.slice(startIndex, startIndex + booksPerSlide);
  };

  // Fetch all books except current one for "You may also like" section
  const fetchAllBooksExceptCurrent = async (currentBookId, currentBookSlug) => {
    try {
      const response = await apiFetch('/books');
      const data = await response.json();
      
      if (data.success) {
        // Filter out the current book and update related books
        const otherBooks = data.books.filter(book => 
          book._id !== currentBookId && book.slug !== currentBookSlug
        );
        setRelatedBooks(otherBooks);
      }
    } catch (error) {
      console.error('Error fetching all books:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Not Found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/books')}
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors duration-300 cursor-pointer"
        >
          Back to Books
        </button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl text-gray-600">No book data available</h2>
          <p className="text-gray-500 mt-2">Debug: slug={slug}, loading={loading.toString()}, error={error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container with proper margins */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/books')}
            className="inline-flex items-center text-brand-primary hover:text-gray-900 transition-colors duration-300 cursor-pointer px-4 py-2 rounded hover:bg-gray-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Books
          </button>
        </div>

        {/* Two Grid Layout - Hero Image and Book Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left Side - Hero Image */}
          <div className="flex justify-center">
            <div className="max-w-sm w-full">
              <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg bg-white p-4">
                <img
                  src={(() => {
                    if (book.coverImage.startsWith('http://') || book.coverImage.startsWith('https://')) {
                      return book.coverImage;
                    } else if (book.coverImage.startsWith('/api/')) {
                      return `${import.meta.env.VITE_API_URL.replace('/api', '')}${book.coverImage}`;
                    } else {
                      return book.coverImage;
                    }
                  })()}
                  alt={book.title}
                  className="w-full h-full object-cover rounded"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.error('Book detail image failed to load:', book.coverImage);
                    e.target.src = '/default-book-cover.jpg';
                  }}
                />
              </div>
              
            </div>
          </div>

          {/* Right Side - Book Details */}
          <div className="space-y-6">
            {/* Book Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {book.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>By {book.author}</span>
                <span>•</span>
                <span>Published {formatDate(book.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Language: </span>
                {book.bookSettings?.language && book.bookSettings.language !== 'NULL' 
                  ? book.bookSettings.language 
                  : 'English'
                }
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              {book.isPurchased ? (
                // Purchased Book Section - With Format Options
                <div className="space-y-4">
                  <div className="flex items-center text-green-600 mb-4">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg font-semibold">You own this book</span>
                  </div>

                  {/* Hard Copy Section for purchased books */}
                  {book.pricingInfo?.hardCopy?.available && (
                    <div className="border-t pt-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Hard Copy Available:</span>
                        <span className="text-sm font-medium text-green-600">Yes</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Hard Copy Price: </span>
                        {book.pricingInfo.hardCopy.displayText}
                      </div>
                    </div>
                  )}

                  {/* Format Selection Dropdown for purchased books */}
                  {book.pricingInfo?.hardCopy?.available && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Format
                        </label>
                        <select 
                          value={selectedFormat} 
                          onChange={handleFormatChange}
                          className="w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        >
                          <option value="soft">Soft Copy - {formatPrice(book.price, book.currency)} (Owned)</option>
                          <option value="hard">Hard Copy - {book.pricingInfo.hardCopy.displayText}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Buttons Section */}
                  <div className="space-y-3">
                    {selectedFormat === 'soft' ? (
                      // Show only Read Book button for soft copy
                      purchaseInfo?.solutionLink?.isEnabled ? (
                        <button
                          onClick={handleReadBook}
                          className="w-full bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                        >
                          Read Book
                        </button>
                      ) : (
                        <div className="w-full bg-yellow-50 border border-yellow-200 px-6 py-4 rounded-lg">
                          <div className="flex items-center justify-center">
                            <svg className="w-6 h-6 mr-3 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="font-semibold text-yellow-700 text-lg">Admin Processing</span>
                          </div>
                          <p className="text-sm text-yellow-600 text-center mt-2">Your book access is being enabled by admin</p>
                        </div>
                      )
                    ) : (
                      // Show buttons for hard copy (Read Book, Add to Cart, and Buy Now)
                      <div className="space-y-2">
                        {purchaseInfo?.solutionLink?.isEnabled ? (
                          <button
                            onClick={handleReadBook}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                          >
                            Read Book (Soft Copy)
                          </button>
                        ) : (
                          <div className="w-full bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                            <div className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium text-yellow-700 text-sm">Processing Soft Copy</span>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddToCart}
                            disabled={cartLoading || purchasing}
                            className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </button>
                          <button
                            onClick={handlePurchase}
                            disabled={purchasing}
                            className="flex-1 bg-brand-primary text-white px-4 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl"
                          >
                            {purchasing ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Buy Now
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Non-purchased Book Section - Full details
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-brand-primary mb-1">
                      {formatPrice(book.price, book.currency)}
                    </div>
                    {book.pricingInfo?.softCopy?.displayText && (
                      <div className="text-sm text-gray-600">
                        {book.pricingInfo.softCopy.displayText}
                      </div>
                    )}
                  </div>

                  {/* Hard Copy Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Hard Copy Available:</span>
                      <span className={`text-sm font-medium ${
                        book.pricingInfo?.hardCopy?.available ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {book.pricingInfo?.hardCopy?.available ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {book.pricingInfo?.hardCopy?.available && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Hard Copy Price: </span>
                        {book.pricingInfo.hardCopy.displayText}
                      </div>
                    )}
                  </div>

                  {/* Purchase Dropdown */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Format
                      </label>
                      <select
                        value={selectedFormat}
                        onChange={handleFormatChange}
                        className="w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      >
                        <option value="soft">Soft Copy - {formatPrice(book.price, book.currency)}</option>
                        {book.pricingInfo?.hardCopy?.available && (
                          <option value="hard">Hard Copy - {book.pricingInfo.hardCopy.displayText}</option>
                        )}
                      </select>
                    </div>

                    {/* Purchase Buttons */}
                    <div className="space-y-2">
                      {/* Add to Cart - only for paid books */}
                      {book.price > 0 && (
                        <button
                          onClick={handleAddToCart}
                          disabled={cartLoading || purchasing}
                          className="w-full bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </button>
                      )}
                      {/* Buy Now Button */}
                      <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="w-full bg-brand-primary text-white px-6 py-3 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl"
                      >
                        {purchasing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {book.price === 0 ? 'Get Free Book' : 'Buy Now'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isLiked 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <svg className={`w-5 h-5 ${isLiked ? 'fill-red-500' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {book.likes || 0}
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
              
            </div>

           
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Description</h2>
            <div 
              className="prose prose-gray text-center max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: book.excerpt }}
            />
            
            {/* Book Details */}
            {(book.bookSettings && Object.keys(book.bookSettings).length > 0) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(book.bookSettings || {}).map(([key, value]) => {
                    const skipFields = ['Book name', 'book name', 'Image'];
                    if (skipFields.includes(key) || !value || value === '') return null;
                    
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {value === 'NULL' ? 'Not specified' : value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8 md:mb-12">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Reader Reviews & Comments</h2>
            <Comments blogId={book._id} />
          </div>
        </div>

        {/* Other Books Section */}
        {relatedBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
            
            {relatedBooks.length > booksPerSlide ? (
              // Carousel view for multiple books
              <div className="relative">
                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                  disabled={currentSlide === 0}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                  disabled={currentSlide === totalSlides - 1}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {Array.from({ length: totalSlides }, (_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {relatedBooks
                            .slice(slideIndex * booksPerSlide, (slideIndex + 1) * booksPerSlide)
                            .map((relatedBook) => (
                              <div
                                key={relatedBook._id}
                                className="cursor-pointer hover:shadow-lg transition-shadow duration-300 group"
                                onClick={() => navigate(`/books/${relatedBook.slug}`)}
                              >
                                <div className="aspect-[3/4] rounded overflow-hidden mb-2 bg-gray-100">
                                  <img
                                    src={relatedBook.coverImage.startsWith('/api/') 
                                      ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${relatedBook.coverImage}` 
                                      : relatedBook.coverImage
                                    }
                                    alt={relatedBook.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-brand-primary transition-colors">
                                  {relatedBook.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(relatedBook.price, relatedBook.currency)}
                                </p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Dot Indicators */}
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 cursor-pointer ${
                        index === currentSlide ? 'bg-brand-primary' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Simple grid for few books
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedBooks.map((relatedBook) => (
                  <div
                    key={relatedBook._id}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-300 group"
                    onClick={() => navigate(`/books/${relatedBook.slug}`)}
                  >
                    <div className="aspect-[3/4] rounded overflow-hidden mb-2 bg-gray-100">
                      <img
                        src={relatedBook.coverImage.startsWith('/api/') 
                          ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${relatedBook.coverImage}` 
                          : relatedBook.coverImage
                        }
                        alt={relatedBook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-brand-primary transition-colors">
                      {relatedBook.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatPrice(relatedBook.price, relatedBook.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share Modal */}
        <Modal
          open={showShareModal}
          onClose={handleCloseShareModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
            sx: { cursor: 'pointer' }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Fade in={showShareModal}>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '16px',
                boxShadow: 24,
                width: '100%',
                maxWidth: '500px',
                position: 'relative',
                outline: 'none',
                cursor: 'default',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <IconButton
                onClick={handleCloseShareModal}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: 'gray',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>

              {/* Modal Header */}
              <div className="px-8 pt-8 pb-2">
                <h3 className="text-2xl font-bold text-gray-900">Share</h3>
              </div>

              {/* Link Section */}
              <div className="px-8 pb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Link to share
                    </label>
                    <div className="space-y-3">
                      {/* URL Display Box */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium break-all select-all cursor-text">
                              {getShareableLink()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Copy Button */}
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl cursor-pointer"
                      >
                        <CopyIcon sx={{ fontSize: '16px' }} />
                        COPY LINK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          </Fade>
        </Modal>
      </div>
    </div>
  );
};

export default BookDetail;