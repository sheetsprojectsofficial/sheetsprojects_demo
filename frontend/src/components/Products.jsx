import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const { settings, getSettingValue } = useSettings();
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();
  const [productsData, setProductsData] = useState({
    heading: '',
    headingHighlight: '',
    subheading: '',
    sectionEnabled: false,
    products: []
  });
  const [loading, setLoading] = useState(true);
  const [purchasedProductIds, setPurchasedProductIds] = useState([]);

  // Load Google Sheets data for section header
  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    const heading = getSettingValue('Products Main Heading', '');
    const headingHighlight = getSettingValue('Products Highlighted Text', '');
    const subheading = getSettingValue('Products Subheading', '');
    const sectionEnabled = getSettingValue('Products Section Enabled', false);
    
    setProductsData(prev => ({
      ...prev,
      heading,
      headingHighlight,
      subheading,
      sectionEnabled
    }));
  };

  // Load Google Sheets data when settings change
  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
        const data = await response.json();
        
        if (data.success && data.products && Array.isArray(data.products)) {
          // Filter only active products
          const activeProducts = data.products.filter(product => product.status === 'Active');
          
          // Limit to first 3 for landing page, show all for products page
          const productsToShow = location.pathname === '/products' 
            ? activeProducts 
            : activeProducts.slice(0, 3);
          
          setProductsData(prev => ({
            ...prev,
            products: productsToShow
          }));
        }
      } catch (error) {
        console.error('Error fetching products data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  // Fetch user purchases when user is logged in
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!user?.email) return;
      
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
          setPurchasedProductIds(data.purchasedProductIds || []);
        }
      } catch (error) {
        console.error('Error fetching user purchases:', error);
      }
    };

    fetchUserPurchases();
  }, [user]);

  // Don't render the section if it's disabled in Google Sheets (for landing page)
  if (location.pathname !== '/products' && !productsData.sectionEnabled) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {productsData.heading}
            {productsData.headingHighlight && (
              <>
                <br />
                <span className="text-brand-primary">{productsData.headingHighlight}</span>
              </>
            )}
          </h2>
          {productsData.subheading && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {productsData.subheading}
            </p>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className={`grid gap-6 mx-auto ${
            location.pathname === '/products' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
          }`}>
            {productsData.products.length > 0 ? (
              productsData.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:scale-105 cursor-pointer relative flex flex-col"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {/* Purchased Badge */}
                  {user && purchasedProductIds.includes(product.id) && (
                    <div className="absolute top-3 right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Purchased
                    </div>
                  )}
                  
                  {/* Product Hero Image/Video */}
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
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
                                  return mediaUrl;
                                }
                                if (mediaUrl.includes('youtube.com/watch?v=')) {
                                  const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
                                  return `https://www.youtube.com/embed/${videoId}`;
                                }

                                // Handle Google Drive links
                                if (mediaUrl.includes('drive.google.com')) {
                                  return mediaUrl.replace('/view?usp=sharing', '/preview').replace('/view?usp=drive_link', '/preview');
                                }

                                return mediaUrl;
                              })()}
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{
                                border: 0,
                                pointerEvents: 'none' // Disable interaction on product cards
                              }}
                              title={product.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          );
                        }

                        // Otherwise, use img tag for regular images
                        return (
                          <img
                            src={mediaUrl}
                            alt={product.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ pointerEvents: 'none' }}
                          />
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-8 h-full">
                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">NO IMAGE</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 pb-2 flex flex-col flex-1">
                    {/* Title and Summary - Fixed height */}
                    <div className="min-h-[120px]">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.summary || ' '}
                      </p>
                    </div>

                    {/* Spacer to push content to bottom */}
                    <div className="flex-grow"></div>

                    {/* Product Type and Price - Fixed at bottom */}
                    <div className="space-y-3 mt-auto">
                      {/* Product Type Badge - Fixed height container */}
                      <div className="flex items-center justify-center min-h-[32px]">
                        {product.productType ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${
                            product.productType === 'Physical'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : product.productType === 'Soft'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {product.productType === 'Physical' && (
                              <>
                                <span>📦</span>
                                <span>Physical</span>
                              </>
                            )}
                            {product.productType === 'Soft' && (
                              <>
                                <span>💾</span>
                                <span>Digital</span>
                              </>
                            )}
                            {product.productType === 'Physical + Soft' && (
                              <>
                                <span>📦💾</span>
                                <span>Both</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      {/* Price and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {product.priceINR && product.priceINR !== '0' ? (
                            <span className="text-lg font-bold text-brand-primary">
                              ₹{product.priceINR}
                            </span>
                          ) : (
                            <span className="text-lg font-bold text-green-600">Free</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                            {product.status}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">No products available at the moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Call to Action - Only show if not on products page */}
        {location.pathname !== '/products' && (
          <div className="text-center mt-12">
            <button onClick={() => navigate('/products')} className={`${themeClasses.primaryButton} cursor-pointer px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 shadow-lg hover:shadow-xl`}>
              View All Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products; 