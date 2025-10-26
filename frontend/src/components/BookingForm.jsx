import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { optimizeImageUrl } from "../utils/imageUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5004";

const BookingForm = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    aadharNumber: "",
    roomNumber: "",
    numberOfAdults: "",
    checkInDate: "",
    checkOutDate: "",
  });

  const [adults, setAdults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());
  const [imageRetryAttempts, setImageRetryAttempts] = useState({});

  // New states for dynamic room data
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomPrice, setRoomPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Slideshow states
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get primary and secondary colors from settings
  const primaryColor = settings?.primaryColor?.value || "#6366f1";
  const secondaryColor = settings?.secondaryColor?.value || "#8b5cf6";

  // Fetch rooms data on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/rooms`);
      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Fallback to default rooms if API fails
      setRooms([
        {
          id: "1",
          name: "Room1",
          capacity: 2,
          price: 1300,
          displayName: "Room 1 (2 Guests)",
        },
        {
          id: "2",
          name: "Room 2",
          capacity: 3,
          price: 2000,
          displayName: "Room 2 (3 Guests)",
        },
        {
          id: "3",
          name: "Room 3",
          capacity: 4,
          price: 3000,
          displayName: "Room 3 (4 Guests)",
        },
      ]);
    }
  };

  // Update adults array when numberOfAdults changes
  useEffect(() => {
    const count = parseInt(formData.numberOfAdults) || 0;
    if (count > 0) {
      const newAdults = Array(count)
        .fill(null)
        .map((_, index) => {
          if (index === 0 && user) {
            // Pre-fill first adult with logged-in user data
            return (
              adults[index] || {
                name: user.displayName || "",
                gender: "",
                age: "",
              }
            );
          }
          return adults[index] || { name: "", gender: "", age: "" };
        });
      setAdults(newAdults);
    } else {
      setAdults([]);
    }
  }, [formData.numberOfAdults]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for phone number
    if (name === "phone") {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "");

      // Limit length based on first digit
      let maxLength = 10;
      if (numericValue.startsWith("0")) {
        maxLength = 11;
      }

      const limitedValue = numericValue.slice(0, maxLength);

      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset availability when room or dates change
    if (["roomNumber", "checkInDate", "checkOutDate"].includes(name)) {
      setIsRoomAvailable(null);
      setAvailabilityMessage("");
    }

    // Handle room selection
    if (name === "roomNumber") {
      setFormData((prev) => ({ ...prev, numberOfAdults: "" }));
      setAdults([]);

      const room = rooms.find((r) => r.id === value);
      setSelectedRoom(room);
      if (room) {
        setRoomPrice(room.price);
        calculateTotalAmount(
          room.price,
          formData.checkInDate,
          formData.checkOutDate
        );
      }
    }

    // Update total amount when dates change
    if ((name === "checkInDate" || name === "checkOutDate") && selectedRoom) {
      const newCheckIn = name === "checkInDate" ? value : formData.checkInDate;
      const newCheckOut =
        name === "checkOutDate" ? value : formData.checkOutDate;
      calculateTotalAmount(selectedRoom.price, newCheckIn, newCheckOut);
    }
  };

  const calculateTotalAmount = (price, checkIn, checkOut) => {
    if (checkIn && checkOut && price) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );
      if (nights > 0) {
        setTotalAmount(price * nights);
      }
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
    if (
      !formData.roomNumber ||
      !formData.checkInDate ||
      !formData.checkOutDate
    ) {
      return;
    }

    // Validate dates
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn >= checkOut) {
      setIsRoomAvailable(false);
      setAvailabilityMessage("Check-out date must be after check-in date");
      return;
    }

    if (checkIn < today) {
      setIsRoomAvailable(false);
      setAvailabilityMessage("Check-in date cannot be in the past");
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityMessage("");

    try {
      // Convert dates to datetime format for API (add default time)
      const checkInDateTime = `${formData.checkInDate}T14:00`;
      const checkOutDateTime = `${formData.checkOutDate}T12:00`;

      const response = await axios.post(
        `${API_BASE_URL}/bookings/check-availability`,
        {
          roomNumber: formData.roomNumber,
          checkInDateTime: checkInDateTime,
          checkOutDateTime: checkOutDateTime,
        }
      );

      if (response.data.success) {
        setIsRoomAvailable(response.data.available);
        setAvailabilityMessage(response.data.message);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setIsRoomAvailable(false);
      setAvailabilityMessage(
        "Error checking room availability. Please try again."
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (
        !formData.roomNumber ||
        !formData.checkInDate ||
        !formData.checkOutDate
      ) {
        toast.error("Please select room and dates");
        return;
      }
      if (isRoomAvailable !== true) {
        toast.error(
          "Please wait for room availability confirmation or select different dates"
        );
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (!formData.numberOfAdults) {
        toast.error("Please select number of guests");
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
      toast.error("Please fill in all contact details");
      return;
    }

    // Validate phone number length
    const phoneLength = formData.phone.length;
    if (formData.phone.startsWith("0")) {
      if (phoneLength !== 11) {
        toast.error("Phone number starting with 0 must be 11 digits");
        return;
      }
    } else {
      if (phoneLength !== 10) {
        toast.error("Phone number must be 10 digits");
        return;
      }
    }

    setLoading(true);

    try {
      // Convert dates to datetime format for API (add default time)
      const checkInDateTime = `${formData.checkInDate}T14:00`;
      const checkOutDateTime = `${formData.checkOutDate}T12:00`;

      const bookingData = {
        ...formData,
        name: adults[0].name, // Main person name
        email: user?.email || "",
        checkInDateTime,
        checkOutDateTime,
        adults: adults.map((adult) => ({
          name: adult.name,
          gender: adult.gender,
          age: parseInt(adult.age),
        })),
      };

      // Create payment order
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/bookings/create-payment`,
        {
          roomNumber: formData.roomNumber,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          name: adults[0].name,
          phone: formData.phone,
          email: user?.email || "",
        }
      );

      if (paymentResponse.data.success) {
        // Initialize Razorpay payment
        await initializeRazorpayPayment(paymentResponse.data, bookingData);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create payment. Please try again.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const initializeRazorpayPayment = async (paymentData, bookingData) => {
    const options = {
      key: paymentData.order.key,
      amount: paymentData.order.amount,
      currency: paymentData.order.currency,
      order_id: paymentData.order.orderId,
      name: "Hotel Booking",
      description: `Room ${bookingData.roomNumber} - ${paymentData.nights} nights`,
      handler: async function (response) {
        // Payment success - verify and create booking
        await verifyPaymentAndCreateBooking(response, bookingData);
      },
      prefill: {
        name: bookingData.name,
        email: bookingData.email,
        contact: bookingData.phone,
      },
      theme: {
        color: primaryColor,
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          toast.error("Payment cancelled");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifyPaymentAndCreateBooking = async (
    paymentResponse,
    bookingData
  ) => {
    setProcessingPayment(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/bookings/verify-payment`,
        {
          orderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          bookingData,
        }
      );

      if (response.data.success) {
        toast.success("Payment successful! Booking confirmed!");

        // Check integration status and show warnings if any
        if (
          response.data.integrationStatus &&
          response.data.integrationStatus.warnings &&
          response.data.integrationStatus.warnings.length > 0
        ) {
          response.data.integrationStatus.warnings.forEach((warning) => {
            toast.warning(warning, { autoClose: 5000 });
          });
        } else if (response.data.integrationStatus) {
          console.log(response.data.integrationStatus);
        }

        // Reset form
        setFormData({
          phone: "",
          address: "",
          aadharNumber: "",
          roomNumber: "",
          numberOfAdults: "",
          checkInDate: "",
          checkOutDate: "",
        });
        setAdults([]);
        setIsRoomAvailable(null);
        setAvailabilityMessage("");
        setCurrentStep(1);
        setSelectedRoom(null);
        setRoomPrice(0);
        setTotalAmount(0);

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to verify payment. Please contact support.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // Get minimum date for input (today)
  const getMinDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get hotel details from settings
  const hotelName = settings?.["Hotel Name"]?.value || "Our Hotel";
  const hotelDescription =
    settings?.["Hotel Description"]?.value || "Welcome to our hotel";
  const hotelImage = settings?.["Hotel Image"]?.value || "";

  // Inject dynamic CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", primaryColor);
    root.style.setProperty("--brand-secondary", secondaryColor);
  }, [primaryColor, secondaryColor]);

  // Auto-play slideshow (hotel image + room images)
  useEffect(() => {
    const roomsWithImages = rooms.filter((room) => room.imageUrl);
    const totalSlides = (hotelImage ? 1 : 0) + roomsWithImages.length;

    if (totalSlides > 1) {
      // Add initial delay before starting slideshow
      const timeout = setTimeout(() => {
        const interval = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 5000); // Change slide every 5 seconds for better viewing
        // Store interval ID for cleanup
        return () => {
          clearInterval(interval);
        };
      }, 2000); // Wait 2 seconds before starting slideshow
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [rooms, hotelImage]);

  // Helper function to convert Google Drive links to direct image URLs
  const getImageUrl = (url) => {
    if (!url) return "";

    // Check if it's a Google Drive link
    if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
      // Extract file ID from various Google Drive URL formats
      let fileId = null;

      // Format: https://drive.google.com/file/d/FILE_ID/view
      const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match1) {
        fileId = match1[1];
      }

      // Format: https://drive.google.com/open?id=FILE_ID
      if (!fileId) {
        const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match2) fileId = match2[1];
      }

      // Format: https://drive.google.com/uc?export=view&id=FILE_ID
      if (!fileId) {
        const match3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match3) fileId = match3[1];
      }

      if (fileId) {
        // Clean the file ID from any trailing parameters
        fileId = fileId.split("&")[0].split("?")[0];

        // Use the thumbnail API which is most reliable for Google Drive
        // This avoids CORS issues and works consistently
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
      }
    }

    // Return the URL as-is if it's not a Google Drive link
    return url;
  };

  // Helper function to get a secondary URL for retry attempts
  const getAlternativeImageUrl = (url) => {
    if (!url) return "";

    // Check if it's a Google Drive link
    if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
      // Extract file ID
      let fileId = null;
      const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match1) {
        fileId = match1[1];
      }
      if (!fileId) {
        const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match2) fileId = match2[1];
      }

      if (fileId) {
        fileId = fileId.split("&")[0].split("?")[0];
        // Try the direct export link as alternative
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    // For non-Google Drive URLs, return as-is
    return url;
  };

  // Fallback image URL - using a placeholder service
  const getFallbackImage = (type = "hotel") => {
    const width = 800;
    const height = 600;
    const bgColor = "4f46e5"; // Indigo color
    const textColor = "ffffff";
    const text = type === "hotel" ? hotelName || "Hotel" : "Room";
    // Use placeholder.com for better reliability
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(
      text
    )}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Room Booking
          </h1>
          <p className="text-lg text-gray-600">Book your stay with us</p>
        </div>

        {/* Two Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Hotel Details */}
          <div className="space-y-6">
            {/* Hotel Name */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                {hotelName}
              </h2>
              <p className="text-gray-600 font-semibold">{hotelDescription}</p>
            </div>

            {/* Combined Hotel & Room Images Slideshow */}
            {(hotelImage ||
              rooms.filter((room) => room.imageUrl).length > 0) && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="relative h-96">
                  {/* Hotel Image - First Slide */}
                  {hotelImage && (
                    <div
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        currentSlide === 0
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      }`}
                    >
                      {/* Fallback background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900"></div>

                      {/* Hotel Image (will overlay the fallback if it loads) */}
                      {!imageError ? (
                        <img
                          src={
                            imageRetryAttempts["hotel"] > 0
                              ? getAlternativeImageUrl(hotelImage)
                              : getImageUrl(hotelImage)
                          }
                          alt={hotelName}
                          className="absolute inset-0 w-full h-full object-cover"
                          onLoad={(e) => {
                            e.target.style.opacity = "1";
                          }}
                          onError={(e) => {
                            const retryCount = imageRetryAttempts["hotel"] || 0;

                            if (retryCount === 0) {
                              // First failure: try alternative URL
                              setImageRetryAttempts((prev) => ({
                                ...prev,
                                hotel: 1,
                              }));
                            } else {
                              // Second failure: show fallback
                              setImageError(true);
                            }
                          }}
                          style={{ opacity: 0, transition: "opacity 0.5s" }}
                        />
                      ) : (
                        // Fallback image when all attempts fail
                        <img
                          src={getFallbackImage("hotel")}
                          alt={hotelName}
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      )}

                      {/* Dark overlay for better text visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                      {/* Hotel name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <h3 className="text-4xl font-bold text-white drop-shadow-lg">
                          {hotelName}
                        </h3>
                        <p className="text-lg text-white/90 mt-2">
                          {hotelDescription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Room Images - Subsequent Slides */}
                  {rooms
                    .filter((room) => room.imageUrl)
                    .map((room, roomIndex) => {
                      const slideIndex = (hotelImage ? 1 : 0) + roomIndex;
                      return (
                        <div
                          key={room.id}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            slideIndex === currentSlide
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          }`}
                        >
                          {/* Fallback background gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900"></div>

                          {/* Image (will overlay the fallback if it loads) */}
                          {!failedImages.has(room.id) ? (
                            <img
                              src={
                                imageRetryAttempts[room.id] > 0
                                  ? getAlternativeImageUrl(room.imageUrl)
                                  : getImageUrl(room.imageUrl)
                              }
                              alt={room.name}
                              className="absolute inset-0 w-full h-full object-cover"
                              onLoad={(e) => {
                                e.target.style.opacity = "1";
                              }}
                              onError={(e) => {
                                const retryCount =
                                  imageRetryAttempts[room.id] || 0;

                                if (retryCount === 0) {
                                  // First failure: try alternative URL
                                  setImageRetryAttempts((prev) => ({
                                    ...prev,
                                    [room.id]: 1,
                                  }));
                                } else {
                                  // Second failure: show fallback
                                  setFailedImages((prev) =>
                                    new Set(prev).add(room.id)
                                  );
                                }
                              }}
                              style={{ opacity: 0, transition: "opacity 0.5s" }}
                            />
                          ) : (
                            // Fallback image when all attempts fail
                            <img
                              src={getFallbackImage("room")}
                              alt={room.name}
                              className="absolute inset-0 w-full h-full object-cover opacity-50"
                            />
                          )}

                          {/* Dark overlay for better text visibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                          {/* Room name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-8">
                            <h3 className="text-4xl font-bold text-white drop-shadow-lg">
                              {room.name}
                            </h3>
                            <p className="text-lg text-white/90 mt-2">
                              Accommodates up to {room.capacity} guests • ₹
                              {room.price}/night
                            </p>
                          </div>
                        </div>
                      );
                    })}

                  {/* Slideshow navigation dots */}
                  {(() => {
                    const roomsWithImages = rooms.filter(
                      (room) => room.imageUrl
                    );
                    const totalSlides =
                      (hotelImage ? 1 : 0) + roomsWithImages.length;
                    return (
                      totalSlides > 1 && (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          {/* Dot for hotel image */}
                          {hotelImage && (
                            <button
                              onClick={() => setCurrentSlide(0)}
                              className={`w-3 h-3 rounded-full transition-all ${
                                currentSlide === 0
                                  ? "bg-white w-8"
                                  : "bg-white/50 hover:bg-white/75"
                              }`}
                              aria-label="Go to hotel image"
                            />
                          )}
                          {/* Dots for room images */}
                          {roomsWithImages.map((room, index) => {
                            const slideIndex = (hotelImage ? 1 : 0) + index;
                            return (
                              <button
                                key={room.id}
                                onClick={() => setCurrentSlide(slideIndex)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  slideIndex === currentSlide
                                    ? "bg-white w-8"
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                aria-label={`Go to ${room.name}`}
                              />
                            );
                          })}
                        </div>
                      )
                    );
                  })()}

                  {/* Previous/Next buttons */}
                  {(() => {
                    const roomsWithImages = rooms.filter(
                      (room) => room.imageUrl
                    );
                    const totalSlides =
                      (hotelImage ? 1 : 0) + roomsWithImages.length;
                    return (
                      totalSlides > 1 && (
                        <>
                          <button
                            onClick={() => {
                              setCurrentSlide((prev) =>
                                prev === 0 ? totalSlides - 1 : prev - 1
                              );
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full p-3 transition-all backdrop-blur-sm"
                            aria-label="Previous slide"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentSlide(
                                (prev) => (prev + 1) % totalSlides
                              );
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full p-3 transition-all backdrop-blur-sm"
                            aria-label="Next slide"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </>
                      )
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Information Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Room Information
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • <strong>Room 1 - Standard Room:</strong> Accommodates up to
                  2 adults
                </li>
                <li>
                  • <strong>Room 2 - Deluxe Room:</strong> Accommodates up to 3
                  adults
                </li>
                <li>
                  • <strong>Room 3 - Suite Room:</strong> Accommodates up to 4
                  adults
                </li>
                <li>
                  • <strong>Check-in Time:</strong> 11:00 AM
                </li>
                <li>
                  • <strong>Check-out Time:</strong> 11:30 AM
                </li>
                <li>• All fields including adults details are mandatory</li>
                <li>• Room availability is checked in real-time</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 h-fit">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="relative px-8">
                {/* Progress Line */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        "var(--brand-primary, " + primaryColor + ")",
                      width: `${((currentStep - 1) / 3) * 100}%`,
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between space-x-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 ${
                          currentStep >= step
                            ? "text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                        style={
                          currentStep >= step
                            ? {
                                backgroundColor:
                                  "var(--brand-primary, " + primaryColor + ")",
                                color: "var(--brand-secondary, white)",
                              }
                            : {}
                        }
                      >
                        {step}
                      </div>
                      <span
                        className={`text-xs text-center whitespace-nowrap ${
                          currentStep === step
                            ? "font-semibold"
                            : "text-gray-600"
                        }`}
                        style={
                          currentStep === step
                            ? {
                                color:
                                  "var(--brand-primary, " + primaryColor + ")",
                              }
                            : {}
                        }
                      >
                        {step === 1 && "Room & Dates"}
                        {step === 2 && "Guests"}
                        {step === 3 && "Guest Details"}
                        {step === 4 && "Contact"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Room Selection and Dates */}
              {currentStep === 1 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Select Room & Dates
                    </h3>
                  </div>

                  {/* Check-in Date */}
                  <div>
                    <label
                      htmlFor="checkInDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                    />
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label
                      htmlFor="checkOutDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                    />
                  </div>
                  {/* Room Number */}
                  <div>
                    <label
                      htmlFor="roomNumber"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                    >
                      <option value="">Select a room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.displayName ||
                            `${room.name} (${room.capacity} Guests)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Display */}
                  {selectedRoom &&
                    formData.checkInDate &&
                    formData.checkOutDate && (
                      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Room Price:</span>
                            <span className="ml-2 font-semibold">
                              ₹{roomPrice}/night
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Amount:</span>
                            <span
                              className="ml-2 font-bold text-lg"
                              style={{ color: primaryColor }}
                            >
                              ₹{totalAmount}
                            </span>
                          </div>
                        </div>
                        {totalAmount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            (
                            {Math.ceil(
                              (new Date(formData.checkOutDate) -
                                new Date(formData.checkInDate)) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            nights)
                          </div>
                        )}
                      </div>
                    )}

                  {/* Availability Status */}
                  {checkingAvailability && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                        <p className="text-blue-700 font-medium">
                          Checking room availability...
                        </p>
                      </div>
                    </div>
                  )}

                  {!checkingAvailability && isRoomAvailable !== null && (
                    <div
                      className={`p-4 border-2 rounded-lg ${
                        isRoomAvailable
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          isRoomAvailable ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isRoomAvailable ? "✓ " : "✗ "}
                        {availabilityMessage}
                      </p>
                      {!isRoomAvailable && (
                        <p className="text-sm text-red-600 mt-2">
                          Please select a different room or choose different
                          dates to proceed.
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
                        backgroundColor:
                          isRoomAvailable === true
                            ? "var(--brand-primary, " + primaryColor + ")"
                            : "#9ca3af",
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Number of Guests
                    </h3>
                  </div>

                  <div>
                    <label
                      htmlFor="numberOfAdults"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                    >
                      <option value="">Select number of guests</option>
                      {selectedRoom &&
                        Array.from(
                          { length: selectedRoom.capacity },
                          (_, i) => i + 1
                        ).map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "Guest" : "Guests"}
                          </option>
                        ))}
                    </select>
                    {selectedRoom && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedRoom.name} can accommodate up to{" "}
                        {selectedRoom.capacity} guests
                      </p>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{
                        borderColor:
                          "var(--brand-primary, " + primaryColor + ")",
                        color: "var(--brand-primary, " + primaryColor + ")",
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!formData.numberOfAdults}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: formData.numberOfAdults
                          ? "var(--brand-primary, " + primaryColor + ")"
                          : "#9ca3af",
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Guest Details
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please provide details for all guests
                    </p>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {adults.map((adult, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-800 mb-3">
                          {index === 0
                            ? "Main Guest (You)"
                            : `Guest ${index + 1}`}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={adult.name}
                              onChange={(e) =>
                                handleAdultChange(index, "name", e.target.value)
                              }
                              required
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                              style={{ "--tw-ring-color": primaryColor }}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={adult.gender}
                              onChange={(e) =>
                                handleAdultChange(
                                  index,
                                  "gender",
                                  e.target.value
                                )
                              }
                              required
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent cursor-pointer"
                              style={{ "--tw-ring-color": primaryColor }}
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
                              onChange={(e) =>
                                handleAdultChange(index, "age", e.target.value)
                              }
                              required
                              min="1"
                              max="120"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                              style={{ "--tw-ring-color": primaryColor }}
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
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{
                        borderColor:
                          "var(--brand-primary, " + primaryColor + ")",
                        color: "var(--brand-primary, " + primaryColor + ")",
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor:
                          "var(--brand-primary, " + primaryColor + ")",
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Contact Details
                    </h3>
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                      placeholder="Enter phone (10 digits or 11 if starting with 0)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.phone &&
                        (formData.phone.startsWith("0")
                          ? `11 digits required (${formData.phone.length}/11)`
                          : `10 digits required (${formData.phone.length}/10)`)}
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                      placeholder="Enter your complete address"
                    />
                  </div>

                  {/* Aadhar Number */}
                  <div>
                    <label
                      htmlFor="aadharNumber"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
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
                        "--tw-ring-color": primaryColor,
                      }}
                      placeholder="Enter 12-digit Aadhar number"
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{
                        borderColor:
                          "var(--brand-primary, " + primaryColor + ")",
                        color: "var(--brand-primary, " + primaryColor + ")",
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor:
                          "var(--brand-primary, " + primaryColor + ")",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </span>
                      ) : (
                        "Confirm Booking"
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
