import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';

const AdminBookings = () => {
  const { getToken } = useAuth();
  const { settings } = useSettings();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  // Get primary and secondary colors from settings
  const primaryColor = settings?.primaryColor?.value || '#6366f1';
  const secondaryColor = settings?.secondaryColor?.value || '#8b5cf6';

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    try {
      const token = await getToken();
      const response = await axios.patch(
        `${API_BASE_URL}/api/bookings/${bookingId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Booking status updated successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setUpdatingBookingId(bookingId);
    try {
      const token = await getToken();
      const response = await axios.patch(
        `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }

    // Filter by room
    if (filterRoom !== 'all' && booking.roomNumber !== filterRoom) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.name.toLowerCase().includes(searchLower) ||
        booking.phone.includes(searchTerm) ||
        booking.email?.toLowerCase().includes(searchLower) ||
        booking.aadharNumber.includes(searchTerm)
      );
    }

    return true;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Room Bookings</h2>
            <p className="text-gray-600 mt-1">
              Total: {bookings.length} | Showing: {filteredBookings.length}
            </p>
          </div>

          <button
            onClick={fetchBookings}
            className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search by name, phone, email, or Aadhar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent cursor-pointer"
              style={{ '--tw-ring-color': primaryColor }}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent cursor-pointer"
              style={{ '--tw-ring-color': primaryColor }}
            >
              <option value="all">All Rooms</option>
              <option value="1">Room 1</option>
              <option value="2">Room 2</option>
              <option value="3">Room 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No bookings found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Guest Details */}
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
                        <span className="font-medium">Aadhar:</span> {booking.aadharNumber}
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
                  </div>
                </div>

                {/* Right Side - Booking Details */}
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
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                        disabled={updatingBookingId === booking._id}
                        className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusBadgeClass(booking.status)} disabled:opacity-50 cursor-pointer`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={updatingBookingId === booking._id}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {updatingBookingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Booked on: {formatDateTime(booking.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
