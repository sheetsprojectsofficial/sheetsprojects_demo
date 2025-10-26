import express from 'express';
import authRoutes from './auth.js';
import heroRoutes from './hero.js';
import navigationRoutes from './navigation.js';
import uploadRoutes from './upload.js';
import subNavbarRoutes from './subNavbar.js';
import footerRoutes from './footer.js';
import portfolioRoutes from './portfolio.js';
import productsRoutes from './products.js';
import checkoutRoutes from './checkout.js';
import ordersRoutes from './orders.js';
import contactRoutes from './contact.js';
import contactFormRoutes from './contactForm.js';
import settingsRoutes from './settings.js';
import syncRoutes from './sync.js';
import blogRoutes from './blog.js';
import commentRoutes from './comment.js';
import bookRoutes from './book.js';
import imageRoutes from './image.js';
import bookingRoutes from './booking.js';
import paymentRoutes from './payment.js';
import cartRoutes from './cart.js';
import chatbotRoutes from './chatbot.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Mount auth routes
router.use('/auth', authRoutes);

// Mount hero routes
router.use('/hero', heroRoutes);

// Mount navigation routes
router.use('/navigation', navigationRoutes);

// Mount upload routes
router.use('/upload', uploadRoutes);

// Mount subnavbar routes
router.use('/subnavbar', subNavbarRoutes);

// Mount footer routes
router.use('/footer', footerRoutes);

// Mount portfolio routes
router.use('/portfolio', portfolioRoutes);

// Mount products routes
router.use('/products', productsRoutes);

// Mount checkout routes
router.use('/checkout', checkoutRoutes);

// Mount orders routes
router.use('/orders', ordersRoutes);

// Mount contact routes
router.use('/contact', contactRoutes);

// Mount contact form routes
router.use('/contact-form', contactFormRoutes);

// Mount settings routes
router.use('/settings', settingsRoutes);

// Mount sync routes
router.use('/sync', syncRoutes);

// Mount blog routes
router.use('/blog', blogRoutes);

// Mount comment routes
router.use('/comments', commentRoutes);

// Mount book routes
router.use('/books', bookRoutes);

// Mount image proxy routes
router.use('/images', imageRoutes);

// Mount booking routes
router.use('/bookings', bookingRoutes);

// Mount payment routes
router.use('/payment', paymentRoutes);

// Mount cart routes
router.use('/cart', cartRoutes);

// Mount chatbot routes
router.use('/chatbot', chatbotRoutes);

export default router; 