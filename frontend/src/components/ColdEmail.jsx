import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

const ColdEmail = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();
  // Step 1: Company search state
  const [companyName, setCompanyName] = useState('');
  const [searchingUrls, setSearchingUrls] = useState(false);

  // Step 2: URLs display state
  const [urls, setUrls] = useState([]);
  const [urlsFound, setUrlsFound] = useState(false);

  // Step 3: Email extraction state
  const [urlEmails, setUrlEmails] = useState({});
  const [loadingUrls, setLoadingUrls] = useState({});

  // Collected emails from all URLs
  const [allEmails, setAllEmails] = useState(new Set());

  // Expanded URLs state (for accordion style)
  const [expandedUrls, setExpandedUrls] = useState({});

  /**
   * Step 1: Search for company URLs
   */
  const handleSearchUrls = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setSearchingUrls(true);
    setUrls([]);
    setUrlsFound(false);
    setUrlEmails({});
    setAllEmails(new Set());

    try {
      console.log('Searching URLs for:', companyName);

      const response = await axios.post(`${API_BASE_URL}/cold-email/search-urls`, {
        companyName: companyName.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('URLs found:', response.data);

      if (response.data.success) {
        const foundUrls = response.data.urls || [];
        setUrls(foundUrls);
        setUrlsFound(true);

        if (foundUrls.length > 0) {
          toast.success(`Found ${foundUrls.length} URLs! Click on any URL to extract emails.`);
        } else {
          toast.info('No URLs found for this company');
        }
      } else {
        toast.error(response.data.error || 'Failed to search URLs');
      }
    } catch (err) {
      console.error('URL search error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to search URLs';
      toast.error(errorMsg);
    } finally {
      setSearchingUrls(false);
    }
  };

  /**
   * Step 2: Extract emails from a specific URL or toggle expansion
   */
  const handleExtractFromUrl = async (urlItem) => {
    const { url, id } = urlItem;

    // If already extracted, toggle expansion
    if (urlEmails[id]) {
      setExpandedUrls(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      return;
    }

    setLoadingUrls(prev => ({ ...prev, [id]: true }));

    try {
      console.log('Extracting emails from:', url);

      const response = await axios.post(`${API_BASE_URL}/cold-email/extract-from-url`, {
        url: url
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('Extraction result:', response.data);

      if (response.data.success) {
        const emails = response.data.emails || [];

        // Store emails for this URL
        setUrlEmails(prev => ({
          ...prev,
          [id]: emails
        }));

        // Add to all emails set
        const newAllEmails = new Set(allEmails);
        emails.forEach(email => newAllEmails.add(email));
        setAllEmails(newAllEmails);

        // Auto-expand if emails found
        if (emails.length > 0) {
          toast.success(`Found ${emails.length} email${emails.length !== 1 ? 's' : ''} from this URL!`);
          setExpandedUrls(prev => ({
            ...prev,
            [id]: true
          }));
        } else {
          toast.info('No emails found on this URL');
        }
      } else {
        toast.error(response.data.error || 'Failed to extract emails');
      }
    } catch (err) {
      console.error('Email extraction error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to extract emails';
      toast.error(errorMsg);

      // Mark as empty array to show it was attempted
      setUrlEmails(prev => ({
        ...prev,
        [id]: []
      }));
    } finally {
      setLoadingUrls(prev => ({ ...prev, [id]: false }));
    }
  };

  /**
   * Reset and start a new search
   */
  const handleNewSearch = () => {
    setCompanyName('');
    setUrls([]);
    setUrlsFound(false);
    setUrlEmails({});
    setAllEmails(new Set());
  };

  /**
   * Copy email to clipboard
   */
  const copyToClipboard = (email) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard!');
  };

  /**
   * Copy all emails to clipboard
   */
  const copyAllEmails = () => {
    const emailArray = Array.from(allEmails);
    const emailText = emailArray.join(', ');
    navigator.clipboard.writeText(emailText);
    toast.success(`Copied ${emailArray.length} email${emailArray.length !== 1 ? 's' : ''} to clipboard!`);
  };

  /**
   * Download all emails as CSV
   */
  const downloadEmails = () => {
    const emailArray = Array.from(allEmails);
    const csvContent = 'Company,Email\n' +
      emailArray.map(email => `"${companyName}","${email}"`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName.replace(/\s+/g, '_')}_emails.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('CSV file downloaded!');
  };

  const allEmailsArray = Array.from(allEmails);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cold Email Finder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Two-step process: First find all URLs, then click on any URL to extract emails from it.
          </p>
        </div>

        {/* Step 1: Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSearchUrls} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Microsoft, Google, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                disabled={searchingUrls}
              />
              <p className="mt-2 text-sm text-gray-500">
                Tip: Try variations like "Company Name", "Company Name Limited", "Company Name Inc", etc.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={searchingUrls || !companyName.trim()}
                className={`flex-1 ${themeClasses.primaryButton} py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl cursor-pointer`}
              >
                {searchingUrls ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching URLs...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search URLs
                  </span>
                )}
              </button>

              {urlsFound && (
                <button
                  type="button"
                  onClick={handleNewSearch}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors duration-200"
                >
                  New Search
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Step 2: URLs List */}
        {urlsFound && urls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Found {urls.length} URL{urls.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click on any URL to extract emails from it
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {urls.map((urlItem) => {
                const emails = urlEmails[urlItem.id] || [];
                const isLoading = loadingUrls[urlItem.id];
                const hasExtracted = urlEmails[urlItem.id] !== undefined;
                const isExpanded = expandedUrls[urlItem.id] || false;

                // Only show URLs that either haven't been extracted yet, are loading, or have emails
                if (hasExtracted && !isLoading && emails.length === 0) {
                  return null; // Hide URLs with no emails
                }

                return (
                  <div
                    key={urlItem.id}
                    className="border rounded-lg overflow-hidden transition-all duration-200 border-gray-200 bg-white hover:shadow-md"
                  >
                    {/* URL Header - Always clickable */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => !isLoading && handleExtractFromUrl(urlItem)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center space-x-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {urlItem.displayUrl}
                            </p>
                            {hasExtracted && emails.length > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                {emails.length} email{emails.length !== 1 ? 's' : ''} found
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : hasExtracted && emails.length > 0 ? (
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Emails List - Accordion Style */}
                    {hasExtracted && isExpanded && emails.length > 0 && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="space-y-2">
                          {emails.map((email, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 rounded-full p-2">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{email}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(email);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-100 rounded-lg"
                                title="Copy email"
                              >
                                <svg className="w-4 h-4 text-gray-600 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Collected Emails */}
        {/* {allEmailsArray.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Collected Emails ({allEmailsArray.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  All unique emails extracted from selected URLs
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyAllEmails}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy All</span>
                </button>
                <button
                  onClick={downloadEmails}
                  className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.primaryButton} rounded-lg transition-colors duration-200 cursor-pointer`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {allEmailsArray.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-900 font-medium">{email}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(email)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-white rounded-lg"
                    title="Copy this email"
                  >
                    <svg className="w-5 h-5 text-gray-600 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* How it works */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How it works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 rounded-full p-4 mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Search URLs</h4>
              <p className="text-gray-600 text-sm">We generate and search for potential URLs across multiple domains (.com, .in, .co.in, etc.)</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 rounded-full p-4 mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Select URLs</h4>
              <p className="text-gray-600 text-sm">Click on any URL to extract emails from that specific website</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 rounded-full p-4 mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Collect & Export</h4>
              <p className="text-gray-600 text-sm">All extracted emails are collected, deduplicated, and ready to copy or download</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColdEmail;
