import express from 'express';
import { getHotelQA } from '../controllers/chatbotController.js';

const router = express.Router();

// POST /api/chatbot/hotel-qa - Fetch Q&A from Hotel Informations Sheet
router.post('/hotel-qa', getHotelQA);

export default router;
