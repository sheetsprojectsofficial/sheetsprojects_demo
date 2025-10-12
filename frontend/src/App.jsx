import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavigationProvider } from "./context/NavigationContext";
import { SubNavbarProvider } from "./context/SubNavbarContext";
import { FooterProvider } from "./context/FooterContext";
import { BrandProvider } from "./context/BrandContext";
import { SettingsProvider } from "./context/SettingsContext";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
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
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Footer from "./components/Footer";
import SEOManager from "./components/SEOManager";
import ScrollToTop from "./components/ScrollToTop";
import BookingForm from "./components/BookingForm";
import MyBookings from "./components/MyBookings";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import DynamicPortfolio from "./components/Portfolios/DynamicPortfolio";

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SubNavbarProvider>
          <BrandProvider>
            <SettingsProvider>
              <FooterProvider>
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
                              <Route path="/" element={<Home />} />
                              <Route path="/products" element={<Products />} />
                              <Route
                                path="/products/:id"
                                element={<ProductDetail />}
                              />
                              <Route path="/blog" element={<Blog />} />
                              <Route path="/blog/:slug" element={<BlogDetail />} />
                              <Route path="/portfolio" element={<DynamicPortfolio />} />
                              <Route path="/sales-portfolio" element={<SalesPortfolio />} />
                              <Route path="/showcase" element={<Showcase />} />
                              <Route path="/books" element={<Books />} />
                              <Route path="/books/:slug" element={<BookDetail />} />
                              <Route path="/courses" element={<Courses />} />
                              <Route path="/contact" element={<ContactUs />} />
                              <Route path="/bookings" element={<BookingForm />} />
                              <Route path="/my-bookings" element={<MyBookings />} />
                              <Route
                                path="/checkout/:id"
                                element={<Checkout />}
                              />

                              <Route path="/login" element={<Login />} />
                              <Route
                                path="/terms"
                                element={<TermsAndConditions />}
                              />
                              <Route
                                path="/privacy"
                                element={<PrivacyPolicy />}
                              />
                              <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                              />
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
              </FooterProvider>
            </SettingsProvider>
          </BrandProvider>
        </SubNavbarProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
