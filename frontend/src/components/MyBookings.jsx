import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const MyBookings = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get primary and secondary colors from settings
  const primaryColor = settings?.primaryColor?.value || '#6366f1';
  const secondaryColor = settings?.secondaryColor?.value || '#8b5cf6';

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      // Fetch all bookings (we'll filter by user's phone/email on frontend for now)
      const response = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, {
        params: {
          userEmail: user?.email,
          userPhone: user?.phoneNumber
        }
      });

      if (response.data.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      // Show sample message for now
      toast.info('To view your bookings, please contact support');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoomBadgeColor = (roomNumber) => {
    switch (roomNumber) {
      case '1':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '2':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case '3':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">
                View and manage your room bookings
              </p>
            </div>

            <button
              onClick={fetchMyBookings}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              Refresh
            </button>
          </div>

          {/* Filter */}
          <div className="mt-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent cursor-pointer"
              style={{ '--tw-ring-color': primaryColor }}
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all'
                ? "You haven't made any bookings yet"
                : `You don't have any ${filterStatus} bookings`}
            </p>
            <button
              onClick={() => window.location.href = '/bookings'}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              Make a Booking
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Booking Details */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{booking.name}</h3>
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Email:</span> {booking.email}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Phone:</span> {booking.phone}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Number of Adults:</span> {booking.numberOfAdults || 0}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getRoomBadgeColor(booking.roomNumber)}`}>
                        Room {booking.roomNumber}
                      </span>
                    </div>

                    {/* Adults Details */}
                    {booking.adults && booking.adults.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Adults Details:</p>
                        <div className="space-y-1">
                          {booking.adults.map((adult, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              {index + 1}. {adult.name} ({adult.gender}, Age: {adult.age})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {booking.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Aadhar:</span> {booking.aadharNumber}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Dates & Status */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Check-In</p>
                        <p className="text-sm text-gray-600 mt-1">{formatDateTime(booking.checkInDateTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Check-Out</p>
                        <p className="text-sm text-gray-600 mt-1">{formatDateTime(booking.checkOutDateTime)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Booked on: {formatDateTime(booking.createdAt)}
                    </div>

                    {/* Contact Support */}
                    {booking.status === 'confirmed' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Need to modify or cancel? Contact support for assistance.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/bookings'}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-all text-left cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">➕</span>
                <div>
                  <div className="font-semibold">Make New Booking</div>
                  <div className="text-sm text-gray-600">Book another room</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/contact'}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-all text-left cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <div className="font-semibold">Contact Support</div>
                  <div className="text-sm text-gray-600">Get help with your booking</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
