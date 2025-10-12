import express from 'express';
import contactFormController from '../controllers/contactFormController.js';

const router = express.Router();

// Submit contact form (public route - no authentication required)
router.post('/submit', contactFormController.submitContactForm);

// Test email configuration (protected route - for admin testing)
router.get('/test-email', contactFormController.testEmailConfig);

export default router;
