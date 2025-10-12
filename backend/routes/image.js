import express from 'express';
import imageController from '../controllers/imageController.js';

const router = express.Router();

// Serve Google Drive images through backend proxy
router.get('/drive/:fileId', imageController.serveImage);

export default router;