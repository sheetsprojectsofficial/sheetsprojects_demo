import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/products');
      const data = await response.json();
      
      if (data.success) {
        // Handle different response formats from Google Sheets vs Database
        const productsData = Array.isArray(data.products) ? data.products : data.products.products || [];
        setProducts(productsData);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error fetching products from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Products</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Products Management</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Products data is fetched from Google Sheets. Total products: {products.length}
            </p>
          </div>
          <button
            onClick={fetchProducts}
            className="px-3 py-2 sm:px-4 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base whitespace-nowrap"
          >
            <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Products</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            This data is read-only and can only be modified from the Google Sheets file
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-4 sm:p-6 text-center">
            <p className="text-gray-500 text-sm sm:text-base">No products found in the Google Sheets</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                    S.No.
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    Title
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Summary
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (INR)
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Price (USD)
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Blog Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {products.map((product, index) => (
                  <React.Fragment key={product.id || index}>
                    <tr className="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onClick={() => toggleRowExpansion(index)}>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button className="mr-1 sm:mr-2 cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                            <svg 
                              className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform ${
                                expandedRows.has(index) ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">
                          {product.title || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {product.summary || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {product.priceINR || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {product.priceUSD || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.productType === 'Physical'
                            ? 'bg-blue-100 text-blue-800'
                            : product.productType === 'Soft'
                            ? 'bg-purple-100 text-purple-800'
                            : product.productType === 'Physical + Soft'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.productType === 'Physical' && '📦 Physical'}
                          {product.productType === 'Soft' && '💾 Digital'}
                          {product.productType === 'Physical + Soft' && '📦💾 Both'}
                          {!product.productType && 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-brand-primary">
                          {product.blogOrder || ''}
                        </span>
                      </td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-3 py-4 sm:px-6 sm:py-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Full Summary</label>
                                <p className="mt-1 text-sm text-gray-900">{product.summary || ''}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Pricing Details</label>
                                <div className="mt-1 space-y-1">
                                  <p className="text-sm text-gray-900">INR: {product.priceINR ? `₹${product.priceINR}` : ''}</p>
                                  <p className="text-sm text-gray-900">USD: {product.priceUSD ? `$${product.priceUSD}` : ''}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Blog Order</label>
                                <p className="mt-1 text-sm text-gray-900">{product.blogOrder || ''}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Product Type</label>
                                <p className="mt-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    product.productType === 'Physical'
                                      ? 'bg-blue-100 text-blue-800'
                                      : product.productType === 'Soft'
                                      ? 'bg-purple-100 text-purple-800'
                                      : product.productType === 'Physical + Soft'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {product.productType === 'Physical' && '📦 Physical Delivery'}
                                    {product.productType === 'Soft' && '💾 Digital Product'}
                                    {product.productType === 'Physical + Soft' && '📦💾 Physical + Digital'}
                                    {!product.productType && 'Not specified'}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Product Image Link</label>
                                <div className="mt-1">
                                  {(product.imageUrl || product.iframe) ? (
                                    <a 
                                      href={product.imageUrl || product.iframe}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-brand-primary hover:text-brand-primary underline text-sm break-all"
                                    >
                                      {product.imageUrl || product.iframe}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-sm"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Resources</label>
                                <div className="mt-1 space-y-2">
                                  {product.iframe && (
                                    <div>
                                      <span className="text-xs text-gray-500">Iframe:</span>
                                      <a 
                                        href={product.iframe}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:text-brand-primary underline text-sm break-all block"
                                      >
                                        {product.iframe}
                                      </a>
                                    </div>
                                  )}
                                  {product.driverGifPath && (
                                    <div>
                                      <span className="text-xs text-gray-500">Driver GIF:</span>
                                      <a 
                                        href={product.driverGifPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:text-brand-primary underline text-sm break-all block"
                                      >
                                        {product.driverGifPath}
                                      </a>
                                    </div>
                                  )}
                                  {product.drivePath && (
                                    <div>
                                      <span className="text-xs text-gray-500">Drive Path:</span>
                                      <a 
                                        href={product.drivePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:text-brand-primary underline text-sm break-all block"
                                      >
                                        {product.drivePath}
                                      </a>
                                    </div>
                                  )}
                                  {product.demoLink && (
                                    <div>
                                      <span className="text-xs text-gray-500">Demo Link:</span>
                                      <a 
                                        href={product.demoLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:text-brand-primary underline text-sm break-all block"
                                      >
                                        {product.demoLink}
                                      </a>
                                    </div>
                                  )}
                                  {product.solutionLink && (
                                    <div>
                                      <span className="text-xs text-gray-500">Solution Link:</span>
                                      <a 
                                        href={product.solutionLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-primary hover:text-brand-primary underline text-sm break-all block"
                                      >
                                        {product.solutionLink}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminProducts;