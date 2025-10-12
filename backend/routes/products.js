import express from 'express';
import productsController from '../controllers/productsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get products data from Google Sheets (public)
router.get('/', productsController.getProducts);

// Get single product by ID (public)
router.get('/:id', productsController.getProductById);

// Get products data from database (fallback)
router.get('/db', productsController.getProductsFromDB);

// Update products data (admin only)
router.put('/', requireAuth, requireAdmin, productsController.updateProducts);

export default router; 