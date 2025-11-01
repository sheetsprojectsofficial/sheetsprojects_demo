import express from 'express';
import {
  scrapeEmails,
  searchCompanyEmails,
  searchCompanyUrls,
  extractEmailsFromUrl,
  testApi
} from '../controllers/coldEmailController.js';

const router = express.Router();

// New two-step flow endpoints
// POST /api/cold-email/search-urls - Step 1: Get all URLs for a company
router.post('/search-urls', searchCompanyUrls);

// POST /api/cold-email/extract-from-url - Step 2: Extract emails from specific URL
router.post('/extract-from-url', extractEmailsFromUrl);

// Main scraping endpoint (legacy - scrapes all URLs automatically)
// POST /api/cold-email/scrape
router.post('/scrape', scrapeEmails);

// Legacy endpoint (backward compatibility)
// POST /api/cold-email/search
router.post('/search', searchCompanyEmails);

// GET /api/cold-email/test - Test API
router.get('/test', testApi);

export default router;