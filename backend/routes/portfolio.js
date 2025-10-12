import express from 'express';
import portfolioController from '../controllers/portfolioController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get portfolio data (public) - for sales portfolio
router.get('/', portfolioController.getPortfolio);

// Update portfolio data (admin only) - for sales portfolio
router.put('/', requireAuth, requireAdmin, portfolioController.updatePortfolio);

// Get portfolio templates (public)
router.get('/templates', portfolioController.getTemplates);

// Copy template sheet for user (public)
router.post('/copy-template', portfolioController.copyTemplate);

// Get form fields from a user's portfolio sheet (public)
router.get('/form-fields/:sheetId', portfolioController.getFormFields);

// Update user portfolio data (public)
router.post('/update-data', portfolioController.updatePortfolioData);

// Serve portfolio template images (public)
router.get('/image/:imageId', portfolioController.getTemplateImage);

// Get dynamic portfolio data based on settings sheet selection (public)
router.get('/dynamic', portfolioController.getDynamicPortfolio);

// Get portfolio data for IntermediatePortfolio component (public) - NEW DYNAMIC ENDPOINT
router.get('/portfolio-data', portfolioController.getPortfolioData);

export default router; 