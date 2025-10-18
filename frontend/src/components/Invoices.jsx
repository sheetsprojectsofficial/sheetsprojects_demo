import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useBrand } from '../context/BrandContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Invoices = () => {
  const { settings } = useSettings();
  const { brandColors } = useBrand();

  // Get dynamic colors from brand context with fallbacks
  const primaryColor = brandColors?.primary || settings?.primaryColor?.value || '#6366f1';
  const secondaryColor = brandColors?.secondary || settings?.secondaryColor?.value || '#8b5cf6';

  // Currency list - hardcoded for now
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
  ];

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    companyLogo: null,
    companyLogoPreview: '',
    companyName: '',
    companyAddress: '',
    gstNo: '',
    billToName: '',
    billToCompanyName: '',
    billToAddress: '',
    billToPhone: '',
    billToEmail: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'INR', // Default currency
    discount: 0,
    taxPercentage: 0, // Tax percentage
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  // Items state - start with one row
  const [items, setItems] = useState([
    { id: 1, itemName: '', description: '', price: 0 }
  ]);

  // Get currency symbol based on selected currency
  const getCurrencySymbol = () => {
    const currency = currencies.find(c => c.code === formData.currency);
    return currency ? currency.symbol : '₹';
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  // Calculate tax amount
  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    const subtotalAfterDiscount = subtotal - discount;
    const taxPercentage = parseFloat(formData.taxPercentage) || 0;
    return (subtotalAfterDiscount * taxPercentage) / 100;
  };

  // Calculate balance due (subtotal - discount + tax)
  const calculateBalanceDue = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  // Validation helper functions
  const validateAlphabetsOnly = (value) => {
    return /^[a-zA-Z\s]*$/.test(value);
  };

  const validateNumbersOnly = (value) => {
    return /^[0-9]*$/.test(value);
  };

  const validatePhone = (value) => {
    // Allow only numbers and validate length
    if (!/^[0-9]*$/.test(value)) return false;
    if (value.length === 0) return true; // Allow empty
    if (value.startsWith('0')) {
      return value.length <= 11;
    }
    return value.length <= 10;
  };

  const validateEmail = (value) => {
    // Basic email validation
    return /^[^\s@]*@?[^\s@]*\.?[^\s@]*$/.test(value);
  };

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Apply validation based on field name
    let isValid = true;

    switch(name) {
      case 'companyName':
      case 'billToName':
      case 'billToCompanyName':
      case 'bankName':
        isValid = validateAlphabetsOnly(value);
        break;
      case 'billToPhone':
        isValid = validatePhone(value);
        break;
      case 'billToEmail':
        isValid = validateEmail(value);
        break;
      case 'invoiceNumber':
      case 'accountNumber':
        isValid = validateNumbersOnly(value);
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          companyLogo: file,
          companyLogoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    // Validate item name (only alphabets and spaces)
    if (field === 'itemName' && !validateAlphabetsOnly(value)) {
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Add new item row
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems(prev => [...prev, { id: newId, itemName: '', description: '', price: 0 }]);
  };

  // Delete item row
  const deleteItem = (id) => {
    if (items.length > 1) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validation functions for each step
  const isStep1Valid = () => {
    return formData.companyName && formData.companyAddress && formData.gstNo;
  };

  const isStep2Valid = () => {
    const phoneValid = formData.billToPhone &&
                      (formData.billToPhone.startsWith('0') ?
                       formData.billToPhone.length === 11 :
                       formData.billToPhone.length === 10);
    const emailValid = formData.billToEmail &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billToEmail);
    return formData.billToName && formData.billToCompanyName && formData.billToAddress &&
           phoneValid && emailValid;
  };

  const isStep3Valid = () => {
    if (!formData.invoiceNumber || !formData.invoiceDate || !formData.dueDate) {
      return false;
    }
    // Ensure due date is not before invoice date
    return new Date(formData.dueDate) >= new Date(formData.invoiceDate);
  };

  const isStep4Valid = () => {
    return items.every(item => item.itemName && item.description && item.price > 0);
  };

  const isStep5Valid = () => {
    return true; // Discount is optional
  };

  const isStep6Valid = () => {
    return formData.bankName && formData.accountNumber && formData.ifscCode;
  };

  // Step navigation functions
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Enhanced print function with better settings
  const handlePrint = () => {
    // Wait a moment for any state updates
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // PDF download function
  const handleDownloadPDF = async () => {
    try {
      const invoiceElement = document.querySelector('.invoice-preview');
      if (!invoiceElement) {
        console.error('Invoice element not found');
        return;
      }

      // Create a clone of the element to avoid modifying the original
      const clonedElement = invoiceElement.cloneNode(true);
      
      // Apply a comprehensive style override to handle oklch colors
      const style = document.createElement('style');
      style.textContent = `
        * {
          color: #000000 !important;
          background-color: transparent !important;
          border-color: #cccccc !important;
        }
        .invoice-preview {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        table, th, td {
          border-color: #cccccc !important;
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        th {
          background-color: #999999 !important;
          color: #ffffff !important;
        }
      `;
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = invoiceElement.offsetWidth + 'px';
      tempContainer.style.height = invoiceElement.offsetHeight + 'px';
      tempContainer.style.backgroundColor = '#ffffff';
      
      // Append the cloned element and styles to the temp container
      tempContainer.appendChild(style);
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Create canvas from the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: false
      });

      // Clean up the temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add top and bottom padding (in mm)
      const topPadding = 20; // 20mm top padding
      const bottomPadding = 20; // 20mm bottom padding
      
      // Calculate dimensions to fit the content with padding
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const availableHeight = pdfHeight - topPadding - bottomPadding;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, availableHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = topPadding; // Start from top padding

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Generate filename based on bill to company name
      const companyName = formData.billToCompanyName || formData.billToName || 'Invoice';
      const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const filename = `${cleanCompanyName} Invoice.pdf`;

      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Inject dynamic CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', primaryColor);
    root.style.setProperty('--brand-secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="page-header text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoice Generator</h1>
          <p className="text-lg text-gray-600">Create professional invoices instantly</p>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            @page {
              margin: 0 !important;
              size: A4;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body * {
              visibility: hidden;
            }
            .invoice-preview, .invoice-preview * {
              visibility: visible;
            }
            .invoice-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 40px 60px !important;
              background: white !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              page-break-inside: avoid;
            }
            .form-section {
              display: none !important;
            }
            .page-header {
              display: none !important;
            }
            
            /* Force full page coverage */
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: 100vh !important;
              overflow: hidden !important;
            }
            
            /* Hide any potential browser UI elements */
            ::-webkit-scrollbar {
              display: none !important;
            }
          }
        `}</style>

        {/* Two Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column - Form */}
          <div className="form-section bg-white rounded-2xl shadow-xl p-6 h-fit">
            {/* Step Indicator */}
            <div className="mb-8">
  <div className="relative px-8">
    {/* Progress Line */}
    <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200">
      <div 
        className="h-full transition-all duration-300"
        style={{
          backgroundColor: 'var(--brand-primary, ' + primaryColor + ')',
          width: `${((currentStep - 1) / 5) * 100}%`
        }}
      />
    </div>
    
    {/* Steps */}
    <div className="relative flex justify-between space-x-4">
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <div key={step} className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 ${
            currentStep >= step
              ? 'text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
          style={currentStep >= step ? { 
            backgroundColor: 'var(--brand-primary, ' + primaryColor + ')',
            color: 'var(--brand-secondary, white)'
          } : {}}>
            {step}
          </div>
          <span className={`text-xs text-center whitespace-nowrap ${
            currentStep === step ? 'font-semibold' : 'text-gray-600'
          }`}
          style={currentStep === step ? { color: 'var(--brand-primary, ' + primaryColor + ')' } : {}}>
            {step === 1 && 'Company'}
            {step === 2 && 'Bill To'}
            {step === 3 && 'Invoice Info'}
            {step === 4 && 'Items'}
            {step === 5 && 'Discount & Tax'}
            {step === 6 && 'Bank Details'}
          </span>
        </div>
      ))}
    </div>
  </div>
</div>

            <form className="space-y-6">
              {/* Step 1: Company Details Section */}
              {currentStep === 1 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Company Details</h3>
                  </div>

                  <div className="space-y-4">
                  {/* Company Logo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                      >
                        Choose File
                      </label>
                      {formData.companyLogoPreview && (
                        <img
                          src={formData.companyLogoPreview}
                          alt="Logo preview"
                          className="h-12 w-12 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Company Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      placeholder="Enter company address"
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* GST No */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GST No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="gstNo"
                      value={formData.gstNo}
                      onChange={handleInputChange}
                      placeholder="Enter GST number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  </div>

                  {/* Next Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep1Valid()}
                      className="w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isStep1Valid() ? 'var(--brand-primary, ' + primaryColor + ')' : '#9ca3af'
                      }}
                    >
                      Next: Bill To
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Bill To Section */}
              {currentStep === 2 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Bill To</h3>
                  </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="billToName"
                      value={formData.billToName}
                      onChange={handleInputChange}
                      placeholder="Customer name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="billToCompanyName"
                      value={formData.billToCompanyName}
                      onChange={handleInputChange}
                      placeholder="Customer company name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="billToAddress"
                      value={formData.billToAddress}
                      onChange={handleInputChange}
                      placeholder="Customer address"
                      rows="2"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="billToPhone"
                      value={formData.billToPhone}
                      onChange={handleInputChange}
                      placeholder="Customer phone"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="billToEmail"
                      value={formData.billToEmail}
                      onChange={handleInputChange}
                      placeholder="Customer email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ 
                        borderColor: 'var(--brand-primary, ' + primaryColor + ')', 
                        color: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep2Valid()}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isStep2Valid() ? 'var(--brand-primary, ' + primaryColor + ')' : '#9ca3af'
                      }}
                    >
                      Next: Invoice Info
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Invoice Information Section */}
              {currentStep === 3 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Invoice Information</h3>
                  </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., INV-001"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      min={formData.invoiceDate || ''}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} - {currency.name} ({currency.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ 
                        borderColor: 'var(--brand-primary, ' + primaryColor + ')', 
                        color: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep3Valid()}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isStep3Valid() ? 'var(--brand-primary, ' + primaryColor + ')' : '#9ca3af'
                      }}
                    >
                      Next: Items
                    </button>
                  </div>
                </>
              )}

              {/* Step 4: Items Section */}
              {currentStep === 4 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    style={{ backgroundColor: 'var(--brand-primary, ' + primaryColor + ')', cursor: 'pointer' }}
                  >
                    <span className="text-lg">+</span> Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-700">Item {index + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 font-bold "
                            style={{ cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                        borderColor: 'var(--brand-primary, ' + primaryColor + ')', 
                        color: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep4Valid()}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isStep4Valid() ? 'var(--brand-primary, ' + primaryColor + ')' : '#9ca3af'
                      }}
                    >
                      Next: Discount
                    </button>
                  </div>
                </>
              )}

              {/* Step 5: Discount & Tax Section */}
              {currentStep === 5 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Discount & Tax</h3>
                  </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="taxPercentage"
                      value={formData.taxPercentage}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.taxPercentage > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Tax Amount: {getCurrencySymbol()}{calculateTax().toFixed(2)}
                      </p>
                    )}
                  </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ 
                        borderColor: 'var(--brand-primary, ' + primaryColor + ')', 
                        color: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep5Valid()}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                      style={{
                        backgroundColor: isStep5Valid() ? 'var(--brand-primary, ' + primaryColor + ')' : '#9ca3af'
                      }}
                    >
                      Next: Bank Details
                    </button>
                  </div>
                </>
              )}

              {/* Step 6: Bank Details Section */}
              {currentStep === 6 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Bank Details</h3>
                  </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="Enter bank name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      placeholder="Enter IFSC code"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  </div>

                  {/* Navigation & Action Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer"
                      style={{ 
                        borderColor: 'var(--brand-primary, ' + primaryColor + ')', 
                        color: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex-1 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--brand-primary, ' + primaryColor + ')'
                      }}
                    >
                      Print Invoice
                    </button>
                  </div>

                  {/* Download PDF Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="cursor-pointer w-full py-4 px-6 border-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
                      style={{ borderColor: 'var(--brand-primary, ' + primaryColor + ')' }}
                    >
                      Download PDF
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Right Column - Live Preview */}
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 h-fit">
            <div className="invoice-preview" style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Company Header */}
              <div className="text-center mb-6">
                {formData.companyLogoPreview && (
                  <div className="mb-2 flex justify-center">
                    <img
                      src={formData.companyLogoPreview}
                      alt="Company Logo"
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--brand-primary, ' + primaryColor + ')' }}>
                  {formData.companyName || 'Company Name'}
                </h2>
                <p className="text-sm mx-auto max-w-md break-words" style={{ color: 'var(--brand-primary, ' + primaryColor + ')' }}>
                  {formData.companyAddress || 'Company Address'}
                </p>
                <p className="text-sm font-semibold mt-2">
                  GST No: {formData.gstNo || 'GST Number'}
                </p>
              </div>

              {/* Bill To and Invoice Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="min-w-0">
                  <p className="text-base font-bold mb-2" style={{ color: 'var(--brand-primary, ' + primaryColor + ')' }}>
                    Bill To:
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-base break-words">{formData.billToName || '{{First Name}} {{Last Name}}'}</p>
                    <p className="font-medium break-words">{formData.billToCompanyName || '{{Company Name}}'}</p>
                    <p className="break-words">{formData.billToAddress || '{{Street Address}}'}</p>
                    <p className="break-words">Phone: {formData.billToPhone || '{{Phone}}'}</p>
                    <p className="break-all">Email: {formData.billToEmail || '{{Email}}'}</p>
                  </div>
                </div>

                <div className="text-right min-w-0">
                  <p className="font-bold text-base break-words">INVOICE # {formData.invoiceNumber || '{{Invoice Number}}'}</p>
                  <p className="text-sm mt-1">Invoice Date: {formData.invoiceDate || '{{Invoice Date}}'}</p>
                  <p className="text-sm">Due Date: {formData.dueDate || '{{Due Date}}'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr style={{ backgroundColor: '#999999' }}>
                      <th className="border border-gray-400 px-3 py-2 text-left text-white w-[30%]">Item Name</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-white w-[50%]">Description</th>
                      <th className="border border-gray-400 px-3 py-2 text-right text-white w-[20%]">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-400 px-3 py-2 break-words">
                          {item.itemName || '{{unit1}}'}
                        </td>
                        <td className="border border-gray-400 px-3 py-2 break-words">
                          {item.description || '{{description1}}'}
                        </td>
                        <td className="border border-gray-400 px-3 py-2 text-right whitespace-nowrap">
                          {item.price > 0 ? `${getCurrencySymbol()}${parseFloat(item.price).toFixed(2)}` : '{{price1}}'}
                        </td>
                      </tr>
                    ))}
                    {formData.taxPercentage > 0 && (
                      <tr>
                        <td className="border border-gray-400 px-3 py-2"></td>
                        <td className="border border-gray-400 px-3 py-2 font-medium">Tax ({formData.taxPercentage}%)</td>
                        <td className="border border-gray-400 px-3 py-2 text-right whitespace-nowrap">{getCurrencySymbol()}{calculateTax().toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mb-6">
                <div className="flex justify-end items-center mb-2 gap-4">
                  <span className="text-sm font-semibold min-w-[100px] text-right">Subtotal:</span>
                  <span className="text-sm font-medium min-w-[120px] text-right">{getCurrencySymbol()}{calculateSubtotal().toFixed(2)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-end items-center mb-2 gap-4">
                    <span className="text-sm font-semibold min-w-[100px] text-right">Discount:</span>
                    <span className="text-sm font-medium min-w-[120px] text-right">-{getCurrencySymbol()}{parseFloat(formData.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                {formData.taxPercentage > 0 && (
                  <div className="flex justify-end items-center mb-2 gap-4">
                    <span className="text-sm font-semibold min-w-[100px] text-right">Tax ({formData.taxPercentage}%):</span>
                    <span className="text-sm font-medium min-w-[120px] text-right">{getCurrencySymbol()}{calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-end items-center gap-4">
                  <span className="text-base font-bold min-w-[100px] text-right">Balance Due:</span>
                  <span className="text-base font-bold min-w-[120px] text-right bg-gray-200 px-3 py-2 rounded">
                    {getCurrencySymbol()}{calculateBalanceDue().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-2 border-black p-4 rounded">
                <p className="font-bold mb- text-base">Pay to:</p>
                <div className="text-sm space-y-1">
                  <p className="break-words"><span className="font-medium">Company:</span> {formData.companyName || 'Company Name'}</p>
                  <p className="break-words"><span className="font-medium">GST No:</span> {formData.gstNo || 'GST Number'}</p>
                  <p className="break-words"><span className="font-medium">Bank:</span> {formData.bankName || 'Bank Name'}</p>
                  <p className="break-all"><span className="font-medium">A/c:</span> {formData.accountNumber || 'Account Number'}</p>
                  <p className="break-words"><span className="font-medium">IFSC:</span> {formData.ifscCode || 'IFSC Code'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
