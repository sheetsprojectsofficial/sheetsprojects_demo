import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { toast, ToastContainer } from 'react-toastify';
import { useCart } from '../context/CartContext';
import 'react-toastify/dist/ReactToastify.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { addToCart, loading: cartLoading } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
        const data = await response.json();
        
        if (data.success && data.products && Array.isArray(data.products)) {
          const foundProduct = data.products.find(p => p.id === parseInt(id));
          if (foundProduct) {
            setProduct(foundProduct);
          } else {
            setError('Product not found');
          }
        } else {
          setError('Failed to fetch product data');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.email || !product?.id) return;
      
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
          const purchased = data.purchasedProductIds?.includes(product.id) || false;
          setIsPurchased(purchased);
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
      }
    };

    checkPurchaseStatus();
  }, [user, product]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.warning('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart('product', product.id);
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/products')}
          className="mb-6 flex items-center text-brand-primary hover:text-brand-primary transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-0">
            {/* Product Hero Image/Video Section */}
            <div className="aspect-video lg:aspect-square bg-gray-100 overflow-hidden relative">
              {product.iframe || product.imageUrl ? (
                (() => {
                  const mediaUrl = product.iframe || product.imageUrl;

                  // Check if it's a YouTube video
                  const isYouTube = mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');

                  // Check if it's a Google Drive video/iframe
                  const isDriveEmbed = mediaUrl.includes('drive.google.com') && (mediaUrl.includes('/preview') || mediaUrl.includes('/file/d/'));

                  // If it's a video/iframe source, use iframe
                  if (isYouTube || isDriveEmbed || product.iframe) {
                    return (
                      <iframe
                        src={(() => {
                          // Handle YouTube URLs
                          if (mediaUrl.includes('youtube.com/embed/')) {
                            return mediaUrl + '?controls=1&showinfo=0&rel=0&modestbranding=1';
                          }
                          if (mediaUrl.includes('youtube.com/watch?v=')) {
                            const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
                            return `https://www.youtube.com/embed/${videoId}?controls=1&showinfo=0&rel=0&modestbranding=1`;
                          }

                          // Handle Google Drive links
                          if (mediaUrl.includes('drive.google.com')) {
                            return mediaUrl.replace('/view?usp=sharing', '/preview').replace('/view?usp=drive_link', '/preview');
                          }

                          return mediaUrl;
                        })()}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ border: 0 }}
                        title={product.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }

                  // Otherwise, use img tag for regular images
                  return (
                    <img
                      src={mediaUrl}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-400 p-12 h-full"><svg class="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span class="text-lg font-medium">FAILED TO LOAD</span></div>';
                      }}
                    />
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-12 h-full">
                  <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-lg font-medium">NO IMAGE</span>
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="p-8 lg:p-12">
              {/* Title and Status */}
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h1>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {product.status}
                  </span>
                  {product.productType && (
                    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                      product.productType === 'Physical'
                        ? 'bg-blue-100 text-blue-800'
                        : product.productType === 'Soft'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {product.productType === 'Physical' && '📦 Physical Delivery'}
                      {product.productType === 'Soft' && '💾 Digital Product'}
                      {product.productType === 'Physical + Soft' && '📦💾 Physical + Digital'}
                    </span>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-semibold text-gray-900">Price:</span>
                    {product.priceINR && product.priceINR !== '0' ? (
                      <span className="text-2xl font-bold text-brand-primary">
                        ₹{product.priceINR}
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-green-600">Free</span>
                    )}
                    {product.priceUSD && product.priceUSD !== '0' && (
                      <span className="text-lg text-gray-500">
                        (${product.priceUSD})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    (If you are facing problems during checkout, please{' '}
                    <a href="/contact" className="text-brand-primary hover:underline">Contact us</a>)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mb-8">
                {/* Top Row: Demo Button (if available) */}
                {product.demoLink && (
                  <button
                    onClick={() => window.open(product.demoLink, '_blank')}
                    className="w-full cursor-pointer bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10.586V18a2 2 0 01-2 2H6a2 2 0 012-2h4.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707z" />
                    </svg>
                    DEMO
                  </button>
                )}

                {/* Bottom Row: Add to Cart + Buy Now (or just Purchased button) */}
                {isPurchased ? (
                  <button
                    onClick={() => toast.warning('You have already purchased this product! Check your email for access details.')}
                    className="w-full cursor-pointer px-6 py-3 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    PURCHASED
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Add to Cart - only for paid products */}
                    {product.priceINR && product.priceINR !== '0' && (
                      <button
                        onClick={handleAddToCart}
                        disabled={cartLoading}
                        className="flex-1 cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        ADD TO CART
                      </button>
                    )}
                    {/* Buy Now Button */}
                    <button
                      onClick={() => navigate(`/checkout/${product.id}`)}
                      className="flex-1 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a2 2 0 002 2h6a2 2 0 002-2v-6m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4" />
                      </svg>
                      {product.priceINR && product.priceINR !== '0' ? 'BUY NOW' : 'GET FREE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {product.summary || 'No detailed description available for this product.'}
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    This is a comprehensive solution that provides step-by-step guidance and implementation details. 
                    You'll get access to all necessary files and documentation to help you understand and implement the solution effectively.
                  </p>
                </div>
              </div>

              {/* Additional Resources - Only show if any link exists */}
              {(product.driverGifPath || product.drivePath || product.solutionLink) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.driverGifPath && (
                      <a
                        href={product.driverGifPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        Preview GIF
                      </a>
                    )}
                    {product.drivePath && (
                      <a
                        href={product.drivePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Access Files
                      </a>
                    )}
                    {product.solutionLink && (
                      <a
                        href={product.solutionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Solution Link
                      </a>
                    )}
                  </div>
                </div>
              )}
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

export default ProductDetail;