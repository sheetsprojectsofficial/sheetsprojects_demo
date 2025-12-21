import express from 'express';
import webinarController from '../controllers/webinarController.js';

const router = express.Router();

router.post('/register', webinarController.register);
// New route to get details
router.get('/upcoming', webinarController.getUpcoming);

export default router;