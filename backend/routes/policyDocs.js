import express from 'express';
import { getPolicyDoc } from '../controllers/policyDocsController.js';

const router = express.Router();

// Get policy document by type
// Supported types: shipping-policy, terms, cancellations-refunds, privacy, about, refund-policy, pricing-policy
router.get('/:type', getPolicyDoc);

export default router;
