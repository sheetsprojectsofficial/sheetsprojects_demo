import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NavigationProvider } from "./context/NavigationContext";
import { SubNavbarProvider } from "./context/SubNavbarContext";
import { FooterProvider } from "./context/FooterContext";
import { BrandProvider } from "./context/BrandContext";
import { SettingsProvider } from "./context/SettingsContext";
import { LoadingProvider } from "./context/LoadingContext";
import { TenantProvider, useTenant } from "./context/TenantContext";

// Feature-gated route component
const FeatureRoute = ({ feature, children }) => {
  const { hasFeature, isTenantMode, loading } = useTenant();

  // If loading tenant config, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not in tenant mode, allow all features
  if (!isTenantMode) {
    return children;
  }

  // Check if feature is enabled
  if (hasFeature(feature)) {
    return children;
  }

  // Feature not enabled - show access denied
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Feature Not Available</h1>
        <p className="text-gray-600 mb-4">This feature is not enabled for this website.</p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { SuperAdminDashboard } from "./components/SuperAdmin";
import SolutionViewer from "./components/SolutionViewer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Products from "./components/Products";
import ProductDetail from "./components/ProductDetail";
import Blog from "./components/Blog";
import BlogDetail from "./components/BlogDetail";
import SalesPortfolio from "./components/SalesPortfolio";
import Showcase from "./components/Showcase";
import Books from "./components/Books";
import BookDetail from "./components/BookDetail";
import BookReader from "./components/BookReader";
import Courses from "./components/Courses";
import ContactUs from "./components/ContactUs";
import Checkout from "./components/Checkout";
import Cart from "./components/Cart";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ShippingPolicy from "./components/ShippingPolicy";
import CancellationsRefunds from "./components/CancellationsRefunds";
import AboutUs from "./components/AboutUs";
import RefundPolicy from "./components/RefundPolicy";
import PricingPolicy from "./components/PricingPolicy";
import Footer from "./components/Footer";
import SEOManager from "./components/SEOManager";
import ScrollToTop from "./components/ScrollToTop";
import BookingForm from "./components/BookingForm";
import MyBookings from "./components/MyBookings";
import Invoices from "./components/Invoices";
import ColdEmail from "./components/ColdEmail";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import DynamicPortfolio from "./components/Portfolios/DynamicPortfolio";
import Webinar from "./components/Webinar";

function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationProvider>
            <SubNavbarProvider>
              <BrandProvider>
                <SettingsProvider>
                  <FooterProvider>
                    <LoadingProvider>
                      <Router>
                    <ScrollToTop />
                    <Routes>
                    {/* Dashboard routes - render without main layout */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Super Admin Dashboard */}
                    <Route
                      path="/superadmin-dashboard"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <SuperAdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Solution viewer - render without main layout */}
                    <Route
                      path="/solution/:orderId"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <SolutionViewer />
                        </ProtectedRoute>
                      }
                    />

                    {/* Book reader - render without main layout for full-screen reading */}
                    <Route
                      path="/books/:slug/read"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <BookReader />
                        </ProtectedRoute>
                      }
                    />

                    {/* Public routes - render with main layout */}
                    <Route
                      path="*"
                      element={
                        <div className="min-h-screen bg-gray-50 flex flex-col">
                          <SEOManager />
                          <Navbar />
                          <div className="flex-1">
                            <Routes>
                              {/* Home - always accessible */}
                              <Route path="/" element={<Home />} />

                              {/* Products - requires Products feature */}
                              <Route path="/products" element={<FeatureRoute feature="Products"><Products /></FeatureRoute>} />
                              <Route path="/products/:id" element={<FeatureRoute feature="Products"><ProductDetail /></FeatureRoute>} />

                              {/* Blog - requires Blog feature */}
                              <Route path="/blog" element={<FeatureRoute feature="Blog"><Blog /></FeatureRoute>} />
                              <Route path="/blog/:slug" element={<FeatureRoute feature="Blog"><BlogDetail /></FeatureRoute>} />

                              {/* Portfolio - requires Portfolio feature */}
                              <Route path="/portfolio" element={<FeatureRoute feature="Portfolio"><DynamicPortfolio /></FeatureRoute>} />
                              <Route path="/sales-portfolio" element={<FeatureRoute feature="Portfolio"><SalesPortfolio /></FeatureRoute>} />
                              <Route path="/showcase" element={<FeatureRoute feature="Portfolio"><Showcase /></FeatureRoute>} />

                              {/* Books - requires Books feature */}
                              <Route path="/books" element={<FeatureRoute feature="Books"><Books /></FeatureRoute>} />
                              <Route path="/books/:slug" element={<FeatureRoute feature="Books"><BookDetail /></FeatureRoute>} />

                              {/* Courses - requires Courses feature */}
                              <Route path="/courses" element={<FeatureRoute feature="Courses"><Courses /></FeatureRoute>} />

                              {/* Contact - requires ContactForm feature */}
                              <Route path="/contact" element={<FeatureRoute feature="ContactForm"><ContactUs /></FeatureRoute>} />

                              {/* Cold Email - requires ColdEmail feature */}
                              <Route path="/cold-email" element={<FeatureRoute feature="ColdEmail"><ColdEmail /></FeatureRoute>} />

                              {/* Bookings - requires Bookings feature */}
                              <Route path="/bookings" element={<FeatureRoute feature="Bookings"><BookingForm /></FeatureRoute>} />
                              <Route path="/my-bookings" element={<FeatureRoute feature="Bookings"><MyBookings /></FeatureRoute>} />

                              {/* Invoices - requires Orders feature */}
                              <Route path="/invoices" element={<FeatureRoute feature="Orders"><Invoices /></FeatureRoute>} />

                              {/* Cart & Checkout - requires Cart feature */}
                              <Route path="/cart" element={<FeatureRoute feature="Cart"><Cart /></FeatureRoute>} />
                              <Route path="/checkout/:id" element={<FeatureRoute feature="Cart"><Checkout /></FeatureRoute>} />

                              {/* Webinar - requires Webinar feature */}
                              <Route path="/webinar" element={<FeatureRoute feature="Webinar"><Webinar /></FeatureRoute>} />

                              {/* Always accessible routes - no feature requirement */}
                              <Route path="/login" element={<Login />} />
                              <Route path="/about" element={<AboutUs />} />
                              <Route path="/terms" element={<TermsAndConditions />} />
                              <Route path="/privacy" element={<PrivacyPolicy />} />
                              <Route path="/shipping" element={<ShippingPolicy />} />
                              <Route path="/cancellations-refunds" element={<CancellationsRefunds />} />
                              <Route path="/refund-policy" element={<RefundPolicy />} />
                              <Route path="/pricing-policy" element={<PricingPolicy />} />

                              {/* Catch-all redirect */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </div>
                          <Footer />
                        </div>
                      }
                    />
                  </Routes>
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                      </Router>
                    </LoadingProvider>
                  </FooterProvider>
                </SettingsProvider>
              </BrandProvider>
            </SubNavbarProvider>
          </NavigationProvider>
        </CartProvider>
      </AuthProvider>
    </TenantProvider>
  );
}

export default App;
