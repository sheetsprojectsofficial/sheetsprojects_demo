import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { optimizeImageUrl } from '../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const ROOM_INFO = {
  '1': { name: 'Standard Room', capacity: 2 },
  '2': { name: 'Deluxe Room', capacity: 3 },
  '3': { name: 'Suite Room', capacity: 4 }
};

const BookingForm = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    aadharNumber: '',
    roomNumber: '',
    numberOfAdults: '',
    checkInDate: '',
    checkOutDate: ''
  });

  const [adults, setAdults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  // Get primary and secondary colors from settings
  const primaryColor = settings?.primaryColor?.value || '#6366f1';
  const secondaryColor = settings?.secondaryColor?.value || '#8b5cf6';

  // Update adults array when numberOfAdults changes
  useEffect(() => {
    const count = parseInt(formData.numberOfAdults) || 0;
    if (count > 0) {
      const newAdults = Array(count).fill(null).map((_, index) => {
        if (index === 0 && user) {
          // Pre-fill first adult with logged-in user data
          return adults[index] || { name: user.displayName || '', gender: '', age: '' };
        }
        return adults[index] || { name: '', gender: '', age: '' };
      });
      setAdults(newAdults);
    } else {
      setAdults([]);
    }
  }, [formData.numberOfAdults]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset availability when room or dates change
    if (['roomNumber', 'checkInDate', 'checkOutDate'].includes(name)) {
      setIsRoomAvailable(null);
      setAvailabilityMessage('');
    }

    // Reset numberOfAdults when room changes
    if (name === 'roomNumber') {
      setFormData(prev => ({ ...prev, numberOfAdults: '' }));
      setAdults([]);
    }
  };

  const handleAdultChange = (index, field, value) => {
    const newAdults = [...adults];
    newAdults[index] = { ...newAdults[index], [field]: value };
    setAdults(newAdults);
  };

  // Check availability when room and dates are selected
  useEffect(() => {
    if (formData.roomNumber && formData.checkInDate && formData.checkOutDate) {
      checkAvailability();
    }
  }, [formData.roomNumber, formData.checkInDate, formData.checkOutDate]);

  const checkAvailability = async () => {
    if (!formData.roomNumber || !formData.checkInDate || !formData.checkOutDate) {
      return;
    }

    // Validate dates
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn >= checkOut) {
      setIsRoomAvailable(false);
      setAvailabilityMessage('Check-out date must be after check-in date');
      return;
    }

    if (checkIn < today) {
      setIsRoomAvailable(false);
      setAvailabilityMessage('Check-in date cannot be in the past');
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityMessage('');

    try {
      // Convert dates to datetime format for API (add default time)
      const checkInDateTime = `${formData.checkInDate}T14:00`;
      const checkOutDateTime = `${formData.checkOutDate}T12:00`;

      const response = await axios.post(`${API_BASE_URL}/api/bookings/check-availability`, {
        roomNumber: formData.roomNumber,
        checkInDateTime: checkInDateTime,
        checkOutDateTime: checkOutDateTime
      });

      if (response.data.success) {
        setIsRoomAvailable(response.data.available);
        setAvailabilityMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsRoomAvailable(false);
      setAvailabilityMessage('Error checking room availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.roomNumber || !formData.checkInDate || !formData.checkOutDate) {
        toast.error('Please select room and dates');
        return;
      }
      if (isRoomAvailable !== true) {
        toast.error('Please wait for room availability confirmation or select different dates');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (!formData.numberOfAdults) {
        toast.error('Please select number of guests');
        return;
      }
    } else if (currentStep === 3) {
      // Validate step 3 - adults details
      for (let i = 0; i < adults.length; i++) {
        if (!adults[i].name || !adults[i].gender || !adults[i].age) {
          toast.error(`Please fill in all details for Guest ${i + 1}`);
          return;
        }
        if (parseInt(adults[i].age) < 1) {
          toast.error(`Please enter a valid age for Guest ${i + 1}`);
          return;
        }
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate step 4 fields
    if (!formData.phone || !formData.address || !formData.aadharNumber) {
      toast.error('Please fill in all contact details');
      return;
    }

    setLoading(true);

    try {
      // Convert dates to datetime format for API (add default time)
      const checkInDateTime = `${formData.checkInDate}T14:00`;
      const checkOutDateTime = `${formData.checkOutDate}T12:00`;

      const bookingData = {
        ...formData,
        name: adults[0].name, // Main person name
        email: user?.email || '',
        checkInDateTime,
        checkOutDateTime,
        adults: adults.map(adult => ({
          name: adult.name,
          gender: adult.gender,
          age: parseInt(adult.age)
        }))
      };

      const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);

      if (response.data.success) {
        toast.success('Booking confirmed successfully!');

        // Reset form
        setFormData({
          phone: '',
          address: '',
          aadharNumber: '',
          roomNumber: '',
          numberOfAdults: '',
          checkInDate: '',
          checkOutDate: ''
        });
        setAdults([]);
        setIsRoomAvailable(null);
        setAvailabilityMessage('');
        setCurrentStep(1);

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date for input (today)
  const getMinDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get hotel details from settings
  const hotelName = settings?.['Hotel Name']?.value || 'Our Hotel';
  const hotelImage = settings?.['Hotel Image']?.value || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Room Booking</h1>
          <p className="text-lg text-gray-600">Book your stay with us</p>
        </div>

        {/* Two Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Hotel Details */}
          <div className="space-y-6">
            {/* Hotel Name */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{hotelName}</h2>
              <p className="text-gray-600">Welcome to our hotel</p>
            </div>

            {/* Hotel Image */}
            {hotelImage && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {!imageError ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl hotel-image-container">
                    <img
                      src={optimizeImageUrl(hotelImage, { width: 800, height: 600 })}
                      alt={hotelName}
                      className="w-full h-96 object-cover rounded-2xl"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                      onError={(e) => {
                        console.error('Hotel image failed to load:', e.target.src);
                        setImageError(true);
                      }}
                    />
                    {/* Gradient overlay for better visual appeal */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  </div>
                ) : (
                  <div className="hotel-fallback bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl p-8 lg:p-12 shadow-2xl relative overflow-hidden h-96 flex items-center justify-center">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full -translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500 opacity-20 rounded-full translate-x-12 translate-y-12"></div>

                    {/* Hotel Name Display */}
                    <div className="relative z-10 text-center">
                      <h3 className="text-3xl lg:text-4xl font-bold text-white">
                        {hotelName}
                      </h3>
                      <p className="text-indigo-200 mt-2">Welcome to our hotel</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Information Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Room Information</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Room 1 - Standard Room:</strong> Accommodates up to 2 adults</li>
                <li>• <strong>Room 2 - Deluxe Room:</strong> Accommodates up to 3 adults</li>
                <li>• <strong>Room 3 - Suite Room:</strong> Accommodates up to 4 adults</li>
                <li>• <strong>Check-in Time:</strong> 11:00 AM</li>
                <li>• <strong>Check-out Time:</strong> 11:30 AM</li>
                <li>• All fields including adults details are mandatory</li>
                <li>• Room availability is checked in real-time</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                        currentStep >= step
                          ? 'text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                      style={currentStep >= step ? { backgroundColor: primaryColor } : {}}>
                        {step}
                      </div>
                      <span className={`mt-2 text-xs text-center whitespace-nowrap ${
                        currentStep === step ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {step === 1 && 'Room & Dates'}
                        {step === 2 && 'Guests'}
                        {step === 3 && 'Guest Details'}
                        {step === 4 && 'Contact'}
                      </span>
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? 'bg-opacity-100' : 'bg-gray-200'
                      }`}
                      style={currentStep > step ? { backgroundColor: primaryColor } : {}}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Room Selection and Dates */}
              {currentStep === 1 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Select Room & Dates</h3>
                  </div>

                  

                  {/* Check-in Date */}
                  <div>
                    <label htmlFor="checkInDate" className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-In Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="checkInDate"
                      name="checkInDate"
                      value={formData.checkInDate}
                      onChange={handleInputChange}
                      required
                      min={getMinDate()}
                      className="w-full cursor-pointer px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                    />
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label htmlFor="checkOutDate" className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-Out Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="checkOutDate"
                      name="checkOutDate"
                      value={formData.checkOutDate}
                      onChange={handleInputChange}
                      required
                      min={formData.checkInDate || getMinDate()}
                      className="w-full cursor-pointer px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                    />
                  </div>
                  {/* Room Number */}
                  <div>
                    <label htmlFor="roomNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Room <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="roomNumber"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all cursor-pointer"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                    >
                      <option value="">Select a room</option>
                      <option value="1">Room 1 - Standard Room (2 Guests)</option>
                      <option value="2">Room 2 - Deluxe Room (3 Guests)</option>
                      <option value="3">Room 3 - Suite Room (4 Guests)</option>
                    </select>
                  </div>

                  {/* Availability Status */}
                  {checkingAvailability && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                        <p className="text-blue-700 font-medium">Checking room availability...</p>
                      </div>
                    </div>
                  )}

                  {!checkingAvailability && isRoomAvailable !== null && (
                    <div className={`p-4 border-2 rounded-lg ${
                      isRoomAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`font-medium ${
                        isRoomAvailable ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isRoomAvailable ? '✓ ' : '✗ '}
                        {availabilityMessage}
                      </p>
                      {!isRoomAvailable && (
                        <p className="text-sm text-red-600 mt-2">
                          Please select a different room or choose different dates to proceed.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isRoomAvailable || checkingAvailability}
                      className="w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isRoomAvailable === true ? primaryColor : '#9ca3af',
                        backgroundImage: isRoomAvailable === true
                          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          : 'none'
                      }}
                    >
                      Next: Select Guests
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Number of Guests */}
              {currentStep === 2 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Number of Guests</h3>
                  </div>

                  <div>
                    <label htmlFor="numberOfAdults" className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Guests <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="numberOfAdults"
                      name="numberOfAdults"
                      value={formData.numberOfAdults}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all cursor-pointer"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                    >
                      <option value="">Select number of guests</option>
                      {Array.from({ length: ROOM_INFO[formData.roomNumber].capacity }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-600 mt-1">
                      {ROOM_INFO[formData.roomNumber].name} can accommodate up to {ROOM_INFO[formData.roomNumber].capacity} guests
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 text-gray-700 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ borderColor: primaryColor }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!formData.numberOfAdults}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: formData.numberOfAdults ? primaryColor : '#9ca3af',
                        backgroundImage: formData.numberOfAdults
                          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          : 'none'
                      }}
                    >
                      Next: Guest Details
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Guest Details */}
              {currentStep === 3 && adults.length > 0 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Guest Details</h3>
                    <p className="text-sm text-gray-600 mb-4">Please provide details for all guests</p>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {adults.map((adult, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          {index === 0 ? 'Main Guest (You)' : `Guest ${index + 1}`}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={adult.name}
                              onChange={(e) => handleAdultChange(index, 'name', e.target.value)}
                              required
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                              style={{ '--tw-ring-color': primaryColor }}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={adult.gender}
                              onChange={(e) => handleAdultChange(index, 'gender', e.target.value)}
                              required
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent cursor-pointer"
                              style={{ '--tw-ring-color': primaryColor }}
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Age <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={adult.age}
                              onChange={(e) => handleAdultChange(index, 'age', e.target.value)}
                              required
                              min="1"
                              max="120"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                              style={{ '--tw-ring-color': primaryColor }}
                              placeholder="Age"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 text-gray-700 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ borderColor: primaryColor }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                        backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      }}
                    >
                      Next: Contact Details
                    </button>
                  </div>
                </>
              )}

              {/* Step 4: Contact Details */}
              {currentStep === 4 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Details</h3>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                      placeholder="Enter your complete address"
                    />
                  </div>

                  {/* Aadhar Number */}
                  <div>
                    <label htmlFor="aadharNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="aadharNumber"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      required
                      maxLength="12"
                      pattern="[0-9]{12}"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                      style={{
                        focusRingColor: primaryColor,
                        '--tw-ring-color': primaryColor
                      }}
                      placeholder="Enter 12-digit Aadhar number"
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 text-gray-700 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ borderColor: primaryColor }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                        backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </span>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
