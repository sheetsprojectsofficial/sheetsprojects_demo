import {
  scrapeCompanyData,
  searchCompany,
  extractContent
} from '../services/emailScraperService.js';

/**
 * Search for company URLs
 * POST /api/cold-email/search-urls
 */
const searchCompanyUrls = async (req, res) => {
  const { companyName } = req.body;

  if (!companyName || !companyName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Company name is required'
    });
  }

  console.log(`🔍 Searching URLs for: ${companyName}`);

  try {
    const urls = await searchCompany(companyName.trim());

    // Validate URLs and add metadata
    const urlsWithMetadata = urls.map((url, index) => ({
      id: `url-${index}`,
      url: url,
      status: 'pending',
      displayUrl: url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }));

    res.json({
      success: true,
      company: companyName,
      urls: urlsWithMetadata,
      totalUrls: urlsWithMetadata.length
    });
  } catch (error) {
    console.error('URL search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Extract emails from a specific URL
 * POST /api/cold-email/extract-from-url
 */
const extractEmailsFromUrl = async (req, res) => {
  const { url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  console.log(`📧 Extracting emails from: ${url}`);

  try {
    const result = await extractContent(url, new Set(), 0, 0);

    res.json({
      success: true,
      url: url,
      emails: result.emails || [],
      totalEmails: result.emails?.length || 0
    });
  } catch (error) {
    console.error('Email extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: url
    });
  }
};

/**
 * Main scraping endpoint (legacy - scrapes all URLs automatically)
 */
const scrapeEmails = async (req, res) => {
  const { companyName } = req.body;

  if (!companyName || !companyName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Company name is required'
    });
  }

  console.log(`📧 Received scraping request for: ${companyName}`);

  try {
    const results = await scrapeCompanyData(companyName.trim());

    res.json({
      success: true,
      company: results.company,
      emails: results.emails,
      processedUrls: results.processedUrls,
      status: results.status,
      totalEmails: results.emails.length
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
};

/**
 * Legacy search company emails endpoint (for backward compatibility)
 */
const searchCompanyEmails = async (req, res) => {
  return scrapeEmails(req, res);
};

/**
 * Health check endpoint
 */
const testApi = async (req, res) => {
  res.json({
    success: true,
    message: 'Cold Email API is running',
    status: 'Server is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      scrape: '/api/cold-email/scrape',
      search: '/api/cold-email/search',
      test: '/api/cold-email/test'
    }
  });
};

export {
  scrapeEmails,
  searchCompanyEmails,
  searchCompanyUrls,
  extractEmailsFromUrl,
  testApi
};