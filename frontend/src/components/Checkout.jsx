import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [itemType, setItemType] = useState('product'); // 'product' or 'book'
  const [bookFormat, setBookFormat] = useState('soft'); // 'soft' or 'hard'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  // Pre-populate form with user data when user is authenticated
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        
        // Check if it's a book (id starts with 'book-')
        if (id.startsWith('book-')) {
          const bookId = id.replace('book-', '');
          setItemType('book');
          
          // Check for format parameter
          const format = searchParams.get('format');
          if (format === 'hard') {
            setBookFormat('hard');
          } else {
            setBookFormat('soft');
          }
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/books/id/${bookId}`);
          const data = await response.json();
          
          if (data.success && data.book) {
            setBook(data.book);
          } else {
            navigate('/books');
          }
        } else {
          // It's a product
          setItemType('product');
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
          const data = await response.json();
          
          if (data.success && data.products && Array.isArray(data.products)) {
            const foundProduct = data.products.find(p => p.id === parseInt(id));
            if (foundProduct) {
              setProduct(foundProduct);
            } else {
              navigate('/products');
            }
          } else {
            navigate('/products');
          }
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        navigate(itemType === 'book' ? '/books' : '/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id, navigate, itemType]);

  // Check if user has already purchased this specific item
  useEffect(() => {
    const checkIfItemPurchased = async () => {
      if (!user?.email) return;
      if (itemType === 'product' && !product?.id) return;
      if (itemType === 'book' && !book?._id) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/user/${encodeURIComponent(user.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        if (data.success) {
          let purchased = false;
          
          if (itemType === 'product') {
            purchased = data.purchasedProductIds?.includes(product.id) || false;
          } else if (itemType === 'book') {
            purchased = data.purchasedBookIds?.includes(book._id) || false;
          }
          
          setIsPurchased(purchased);
          
          if (purchased) {
            toast.info(`You have already purchased this ${itemType}! Redirecting...`);
            setTimeout(() => navigate(itemType === 'book' ? '/books' : '/products'), 2000);
          }
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
      }
    };

    checkIfItemPurchased();
  }, [user, product, book, navigate, itemType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentItem = itemType === 'book' ? book : product;

    // Calculate price for validation
    const getBookPrice = () => {
      if (!book) return 0;
      if (bookFormat === 'hard' && book.pricingInfo?.hardCopy?.available) {
        const hardCopyPrice = book.pricingInfo.hardCopy.displayText?.match(/\d+/)?.[0];
        return hardCopyPrice ? parseInt(hardCopyPrice) : book.price;
      }
      return book.price;
    };

    const bookPrice = getBookPrice();
    const isFreeItem = itemType === 'book' ? (bookPrice === 0) : (!product?.priceINR || product.priceINR === '0');

    // Determine if address is required based on product type AND payment status
    // For products: Address required if (Physical OR Physical + Soft) OR if it's a paid product
    // For books: all paid books require address (existing behavior)
    const requiresPhysicalDelivery = itemType === 'product'
      ? (product?.productType === 'Physical' || product?.productType === 'Physical + Soft')
      : true; // Books always require address if paid

    // Address is required if: (requires physical delivery) OR (is a paid item)
    const requiresAddress = requiresPhysicalDelivery || !isFreeItem;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/[^\d]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    // Address is required for items that need physical delivery OR paid items
    if (requiresAddress && !formData.address.trim()) {
      if (requiresPhysicalDelivery && !isFreeItem) {
        newErrors.address = 'Address is required for physical delivery and paid items';
      } else if (requiresPhysicalDelivery) {
        newErrors.address = 'Address is required for physical delivery';
      } else {
        newErrors.address = 'Address is required for paid items';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if already purchased
    if (isPurchased) {
      toast.warning(`You have already purchased this ${itemType}!`);
      return;
    }
    
    if (validateForm()) {
      setSubmitting(true);
      try {
        if (itemType === 'book') {
          // Book purchase
          const orderData = {
            userId: user.uid,
            userName: formData.fullName,
            userEmail: user.email, // Use Firebase user's email, not form email
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            bookId: book._id,
            bookTitle: book.title,
            bookSlug: book.slug,
            bookPrice: bookPrice,
            currency: book.currency || 'USD',
            totalAmount: bookPrice,
            status: 'completed'
          };
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/books/${book._id}/purchase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify(orderData)
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success('Book purchased successfully!');
            setTimeout(() => {
              navigate(`/books/${book.slug}`);
            }, 2000);
          } else {
            toast.error(data.message || 'Failed to complete purchase');
          }
        } else {
          // Product purchase
          const orderData = {
            productId: product.id,
            customerInfo: formData
          };
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success(data.message);
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            toast.error(data.message || 'Please try again later');
          }
        }
        
      } catch (error) {
        console.error('Error submitting order:', error);
        toast.error('Error processing order. Please check your connection and try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!product && !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{itemType === 'book' ? 'Book' : 'Product'} Not Found</h1>
          <button
            onClick={() => navigate(itemType === 'book' ? '/books' : '/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to {itemType === 'book' ? 'Books' : 'Products'}
          </button>
        </div>
      </div>
    );
  }

  const currentItem = itemType === 'book' ? book : product;
  // Calculate final price for display
  const getBookPrice = () => {
    if (!book) return 0;
    if (bookFormat === 'hard' && book.pricingInfo?.hardCopy?.available) {
      // Extract numeric price from hardCopy displayText (e.g., "20" from "Hard Copy - 20")
      const hardCopyPrice = book.pricingInfo.hardCopy.displayText?.match(/\d+/)?.[0];
      return hardCopyPrice ? parseInt(hardCopyPrice) : book.price;
    }
    return book.price;
  };

  const bookPrice = getBookPrice();
  const isFreePorduct = itemType === 'book' ? (bookPrice === 0) : (!product?.priceINR || product.priceINR === '0');
  const price = itemType === 'book' ? (bookPrice || 0) : (isFreePorduct ? 0 : parseInt(product?.priceINR || 0));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(itemType === 'book' ? `/books/${book?.slug}` : `/products/${product?.id}`)}
            className="mb-6 flex items-center text-brand-primary hover:text-brand-primary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {itemType === 'book' ? 'Book' : 'Product'}
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {isFreePorduct ? 'Get Free Access' : 'Checkout'}
            </h1>
            <p className="text-gray-600">
              Complete your {isFreePorduct ? 'registration' : 'purchase'} to access this resource
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - User Details Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {isFreePorduct ? 'Your Information' : 'Billing Information'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={user && user.email} 
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } ${user && user.email ? 'bg-gray-50 text-gray-500' : ''}`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Address (Required for physical delivery products OR paid items) */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address {(() => {
                    // Show * if product requires physical delivery OR is a paid item
                    const isFree = itemType === 'book'
                      ? (bookPrice === 0)
                      : (!product?.priceINR || product.priceINR === '0');
                    const requiresPhysicalDelivery = itemType === 'product'
                      ? (product?.productType === 'Physical' || product?.productType === 'Physical + Soft')
                      : true; // Books always require address if paid
                    const requiresAddress = requiresPhysicalDelivery || !isFree;
                    return requiresAddress ? '*' : '';
                  })()}
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors resize-none ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={(() => {
                    const isFree = itemType === 'book'
                      ? (bookPrice === 0)
                      : (!product?.priceINR || product.priceINR === '0');
                    if (itemType === 'product' && product?.productType === 'Soft' && isFree) {
                      return 'Address (optional for free digital products)';
                    }
                    return 'Enter your complete delivery address';
                  })()}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
                {itemType === 'product' && product?.productType && (
                  <p className="mt-1 text-xs text-gray-500">
                    {product.productType === 'Physical' && 'Physical delivery - Address required'}
                    {product.productType === 'Soft' && !isFreePorduct && 'Digital product - Address required for paid items'}
                    {product.productType === 'Soft' && isFreePorduct && 'Digital product - Address optional'}
                    {product.productType === 'Physical + Soft' && 'Available in both physical and digital formats - Address required'}
                  </p>
                )}
              </div>

              {/* Mobile Submit Button */}
              <button
                onClick={handleSubmit}
                type="submit"
                disabled={submitting || isPurchased}
                className={`w-full lg:hidden py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  submitting || isPurchased
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPurchased ? (
                  'Already Purchased'
                ) : submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  isFreePorduct ? `Get Free ${itemType === 'book' ? 'Book' : 'Access'}` : `Pay ₹${price}`
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Details</h2>
              
              <div className="flex items-start space-x-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {itemType === 'book' ? (
                    <img
                      src={book?.coverImage?.startsWith('/api/') ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${book.coverImage}` : book?.coverImage}
                      alt={book?.title}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (product?.iframe || product?.imageUrl) ? (
                    <iframe
                      src={(() => {
                        const mediaUrl = product.iframe || product.imageUrl;
                        if (mediaUrl.includes('youtube.com/embed/')) {
                          return mediaUrl + '?controls=0&showinfo=0&rel=0&modestbranding=1';
                        }
                        if (mediaUrl.includes('youtube.com/watch?v=')) {
                          const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
                          return `https://www.youtube.com/embed/${videoId}?controls=0&showinfo=0&rel=0&modestbranding=1`;
                        }
                        if (mediaUrl.includes('drive.google.com')) {
                          return mediaUrl.replace('/view?usp=sharing', '/preview').replace('/view?usp=drive_link', '/preview') + '?embedded=true';
                        }
                        return mediaUrl;
                      })()}
                      className="w-full h-full rounded-lg"
                      style={{ border: 0, pointerEvents: 'none' }}
                      title={product.title}
                    ></iframe>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {itemType === 'book' ? book?.title : product?.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {itemType === 'book' ? book?.excerpt : product?.summary}
                  </p>
                  {itemType === 'book' ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Book
                      </span>
                      <span className="text-xs text-gray-500">by {book?.author}</span>
                    </div>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {product?.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total & Payment */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {isFreePorduct ? 'Summary' : 'Payment Summary'}
              </h2>
              
              <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {isFreePorduct ? '₹0' : `₹${price}`}
                  </span>
                </div>

                {/* Tax (if applicable) */}
                {!isFreePorduct && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-gray-900">₹0</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-4 bg-blue-50 rounded-lg px-4">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-brand-primary">
                    {isFreePorduct ? '₹0' : `₹${price}`}
                  </span>
                </div>
              </div>

              {/* Desktop Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || isPurchased}
                className={`hidden lg:block w-full mt-6 py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                  submitting || isPurchased
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                {isPurchased ? (
                  'Already Purchased'
                ) : submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  isFreePorduct ? `Get Free ${itemType === 'book' ? 'Book' : 'Access'}` : `Pay ₹${price}`
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure & encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Checkout;