import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getThemeClasses } = useTheme();
  const { settings } = useSettings();
  const themeClasses = getThemeClasses();
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedProducts();
    fetchMyBookings();
  }, [user]);

  const fetchPurchasedProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/my-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setPurchasedProducts(data.purchases);
        setError(null);
      } else {
        setError('Failed to fetch purchased products');
      }
    } catch (err) {
      console.error('Error fetching purchased products:', err);
      setError('Error fetching purchased products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!user) return;

    try {
      setBookingsLoading(true);

      // Get user email and phone
      const userEmail = user?.email;
      const userPhone = user?.phoneNumber;


      const response = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, {
        params: {
          userEmail: userEmail,
          userPhone: userPhone
        }
      });


      if (response.data.success) {
        setMyBookings(response.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
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

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'out-for-delivery':
        return 'Out for Delivery';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Function to check if Bookings menu is enabled
  const isBookingsMenuEnabled = () => {
    if (!settings || Object.keys(settings).length === 0) return false;

    const keys = Object.keys(settings);
    const menuOptionsIndex = keys.findIndex(key => key === 'Menu options');
    const ourWorkSectionIndex = keys.findIndex(key => key === 'Our Work Section');

    if (menuOptionsIndex === -1 || ourWorkSectionIndex === -1) {
      return false;
    }

    const navigationKeys = keys.slice(menuOptionsIndex + 1, ourWorkSectionIndex);

    for (const key of navigationKeys) {
      if (key.toLowerCase() === 'bookings') {
        const setting = settings[key];

        if (typeof setting === 'object' && setting.hasOwnProperty('value')) {
          if (typeof setting.value === 'boolean') {
            return setting.value;
          } else if (typeof setting.value === 'string') {
            const value = setting.value.toLowerCase().trim();
            return value === 'show' || value === 'true' || value === '1' || value === 'yes' || value === 'on';
          } else if (setting.value === true || setting.value === 1) {
            return true;
          }
        }
      }
    }

    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <>
          {/* Only show My Purchases header if there are purchases */}
          {purchasedProducts.length > 0 && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--brand-primary)'}}>My Purchases</h1>
              <p className="text-gray-600">View and access your purchased products and books</p>
            </div>
          )}

      {/* Only show purchases section if there are purchases */}
      {purchasedProducts.length > 0 && (
        <div className="space-y-6">
          {purchasedProducts.map((purchase) => (
            <div key={purchase._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {purchase.itemType === 'book' ? purchase.bookInfo?.title : purchase.productInfo?.title}
                        </h3>
                        {purchase.itemType === 'book' ? (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                              Book
                            </span>
                            <span className="text-gray-600">by {purchase.bookInfo?.author}</span>
                          </div>
                        ) : (
                          <>
                            {purchase.productInfo?.summary && (
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {purchase.productInfo.summary}
                              </p>
                            )}
                            {purchase.productInfo?.productType && (
                              <div className="mb-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.productInfo.productType === 'Physical'
                                    ? 'bg-blue-100 text-blue-800'
                                    : purchase.productInfo.productType === 'Soft'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {purchase.productInfo.productType === 'Physical' && '📦 Physical Product'}
                                  {purchase.productInfo.productType === 'Soft' && '💾 Digital Product'}
                                  {purchase.productInfo.productType === 'Physical + Soft' && '📦💾 Physical + Digital'}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Order ID: {purchase.orderId}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
                            </svg>
                            Purchased: {formatDate(purchase.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(purchase.status)}`}>
                          {getStatusDisplayText(purchase.status)}
                        </span>
                        <div className="text-lg font-bold text-gray-900">
                          {purchase.isFree ? 'Free' : `₹${purchase.totalAmount}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Action Button */}
                    {purchase.itemType === 'book' ? (
                      <button
                        onClick={() => navigate(`/books/${purchase.bookInfo?.slug}`)}
                        className={`${themeClasses.secondaryButton} inline-flex items-center cursor-pointer justify-center px-6 py-3 font-medium rounded-lg transition-colors duration-200`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Read Book
                      </button>
                    ) : purchase.productInfo?.productType === 'Physical' ? (
                      // For physical-only products, show tracking info instead of solution link
                      <div className="inline-flex items-center justify-center px-6 py-3 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Physical Delivery in Progress
                      </div>
                    ) : purchase.solutionLink?.isEnabled ? (
                      <button
                        onClick={() => navigate(`/solution/${purchase.orderId}`)}
                        className={`${themeClasses.primaryButton} inline-flex items-center cursor-pointer justify-center px-6 py-3 font-medium rounded-lg transition-colors duration-200`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Solution
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-lg cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Solution Processing...
                      </div>
                    )}
                    
                    
                    {purchase.status === 'delivered' && purchase.productInfo?.supportEmail && (
                      <button
                        onClick={() => navigate('/contact')}
                        className="inline-flex items-center cursor-pointer justify-center px-6 py-3 font-medium rounded-lg transition-colors duration-200"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
                          color: 'var(--brand-primary)',
                          border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 20%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--brand-primary) 10%, transparent)';
                        }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Support
                      </button>
                    )}
                  </div>

                  {/* Status info messages */}
                  {purchase.productInfo?.productType === 'Physical' ? (
                    // Physical product delivery tracking
                    <div className={`mt-4 p-4 rounded-lg border ${
                      purchase.status === 'delivered'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex">
                        <svg className={`w-5 h-5 mt-0.5 ${
                          purchase.status === 'delivered' ? 'text-green-400' : 'text-blue-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <div className="ml-3">
                          <h4 className={`text-sm font-medium ${
                            purchase.status === 'delivered' ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            {purchase.status === 'delivered' ? 'Delivered Successfully' : 'Delivery Status'}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            purchase.status === 'delivered' ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {purchase.status === 'pending' && 'Your order is being prepared for shipment.'}
                            {purchase.status === 'packed' && 'Your order has been packed and is ready to ship.'}
                            {purchase.status === 'shipped' && 'Your order has been shipped and is on its way!'}
                            {purchase.status === 'out-for-delivery' && 'Your order is out for delivery and will arrive soon!'}
                            {purchase.status === 'delivered' && 'Your order has been successfully delivered. Enjoy your purchase!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : purchase.status === 'pending' && purchase.itemType !== 'book' && (
                    // Digital product solution processing
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.348 14.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">Solution Processing</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your solution is being prepared. The "View Solution" button will appear here once it's ready.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

          <div className="mt-8 p-6 rounded-lg" style={{
            backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)'
          }}>
            <div className="flex">
              <svg className="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--brand-primary)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-lg font-medium mb-2" style={{color: 'var(--brand-primary)'}}>Need Help?</h4>
                <p className="mb-4" style={{color: 'color-mix(in srgb, var(--brand-primary) 80%, black)'}}>
                  If you're having trouble accessing your solutions or need support, don't hesitate to reach out to us.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/contact')}
                    className={`${themeClasses.primaryButton} inline-flex items-center cursor-pointer px-4 py-2 font-medium rounded-lg transition-colors duration-200`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>

      {/* My Bookings Section */}
      {isBookingsMenuEnabled() && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{color: 'var(--brand-primary)'}}>My Bookings</h2>
          <p className="text-gray-600 mb-6">View your room bookings and reservations</p>

          {bookingsLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-4">You haven't made any room bookings yet.</p>
              <button
                onClick={() => navigate('/bookings')}
                className={`${themeClasses.primaryButton} inline-flex items-center px-6 py-3 font-medium rounded-lg transition-colors duration-200 cursor-pointer`}
              >
                Make a Booking
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.slice(0, 3).map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">Room {booking.roomNumber}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(booking.checkInDateTime).toLocaleDateString('en-IN')} - {new Date(booking.checkOutDateTime).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Adults:</span> {booking.numberOfAdults || 0}
                      </p>
                      {booking.adults && booking.adults.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">Adults Details:</p>
                          <div className="space-y-0.5">
                            {booking.adults.map((adult, index) => (
                              <p key={index} className="text-xs text-gray-600">
                                {index + 1}. {adult.name} ({adult.gender}, Age: {adult.age})
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {myBookings.length > 3 && (
                <button
                  onClick={() => navigate('/my-bookings')}
                  className={`${themeClasses.secondaryButton} w-full inline-flex items-center justify-center px-4 py-3 font-medium rounded-lg transition-colors duration-200 cursor-pointer`}
                >
                  View All Bookings ({myBookings.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;