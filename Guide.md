# SheetsProjects

## 1. Project Overview

**SheetsProjects** is a full-stack web application that functions as a comprehensive **CMS-driven e-commerce and content management platform** powered by Google Sheets. It's a unique hybrid system that combines:

- E-commerce platform for digital and physical products
- Blog/Content management system
- Book publishing and reading platform
- Booking/reservation system
- CRM (Customer Relationship Management) system
- Email campaign management tool
- Dynamic portfolio generator

The core innovation is using Google Sheets as the primary data source for products, settings, and blogs, which are synced to MongoDB for performance.

## 2. Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB with Mongoose ORM v8.0.3
- **Authentication**: Firebase Admin SDK v12.0.0
- **Google Integration**:
  - Google Sheets API (googleapis v156.0.0)
  - Google Drive API
  - Google Calendar API
- **File Upload**: Multer v2.0.0-rc.4, Cloudinary v1.41.0
- **Email**: Nodemailer v7.0.10
- **Payment**: Razorpay v2.9.6
- **AI**: Google Generative AI v0.24.1
- **Web Scraping**: Cheerio v1.1.2, Axios v1.13.1
- **Document Processing**: Mammoth v1.10.0

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Routing**: React Router DOM v6.20.1
- **Styling**:
  - Tailwind CSS v4.1.11
  - Material-UI (MUI) v7.3.1
  - Emotion (CSS-in-JS)
- **Authentication**: Firebase SDK v10.7.1, React Firebase Hooks v5.1.1
- **State Management**: React Context API
- **UI Components**:
  - Lucide React (icons) v0.553.0
  - React Toastify v11.0.5
  - QRCode.react v4.2.0
- **PDF Generation**: jsPDF v3.0.3, html2canvas v1.4.1

### Development Tools
- **Linting**: ESLint v9.30.1
- **Dev Server**: Nodemon v3.0.2 (backend), Vite (frontend)

## 3. Main Directory Structure

```
sheetsprojects_demo/
├── backend/                    # Express.js API server
│   ├── config/                 # Configuration files
│   │   ├── database.js        # MongoDB connection setup
│   │   ├── firebase.js        # Firebase Admin initialization
│   │   ├── googlesheets.js    # Google Sheets API integration
│   │   ├── cloudinary.js      # Cloudinary config
│   │   ├── email.js           # Nodemailer config
│   │   └── razorpay.js        # Razorpay payment config
│   ├── controllers/           # Business logic (27 controllers)
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   ├── bookController.js
│   │   ├── emailCampaignController.js
│   │   ├── ordersController.js
│   │   ├── paymentController.js
│   │   └── ... (21 more)
│   ├── models/                # Mongoose schemas (22 models)
│   │   ├── User.js           # User accounts with roles
│   │   ├── ProductsFromSheets.js  # Synced from Google Sheets
│   │   ├── Blog.js           # Blog posts synced from Drive
│   │   ├── Book.js           # eBooks synced from Drive
│   │   ├── Order.js          # Customer orders
│   │   ├── Booking.js        # Room/service bookings
│   │   ├── CRM.js            # CRM contacts
│   │   ├── EmailCampaign.js  # Email campaigns
│   │   └── ... (14 more)
│   ├── routes/                # API route definitions (28 route files)
│   ├── services/              # Business services (12 services)
│   │   ├── syncService.js    # Periodic sync from Google Sheets
│   │   ├── emailService.js   # Email sending
│   │   ├── bookService.js    # Book management with Google Drive
│   │   ├── calendarService.js # Google Calendar integration
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   └── auth.js           # Firebase token verification
│   ├── utils/                 # Utility functions
│   ├── uploads/               # File upload directory
│   ├── server.js             # Express server entry point
│   └── package.json
│
└── frontend/                   # React SPA
    ├── src/
    │   ├── components/        # React components (52 components)
    │   │   ├── Dashboard.jsx  # Admin dashboard
    │   │   ├── Navbar.jsx     # Main navigation
    │   │   ├── Footer.jsx     # Footer component
    │   │   ├── Products.jsx   # Product listing
    │   │   ├── Books.jsx      # Book marketplace
    │   │   ├── Blog.jsx       # Blog listing
    │   │   ├── Checkout.jsx   # Checkout flow
    │   │   ├── BookingForm.jsx # Booking system
    │   │   ├── CRM/           # CRM components (10 files)
    │   │   ├── EmailCampaign/ # Email campaign wizard (11 files)
    │   │   └── Portfolios/    # Dynamic portfolio templates
    │   ├── context/           # React Context providers (9 contexts)
    │   │   ├── AuthContext.jsx      # Firebase authentication
    │   │   ├── CartContext.jsx      # Shopping cart state
    │   │   ├── BrandContext.jsx     # Brand settings
    │   │   ├── NavigationContext.jsx # Dynamic navigation
    │   │   └── ...
    │   ├── hooks/             # Custom React hooks
    │   │   └── useCRM.js      # CRM operations hook
    │   ├── utils/             # Utility functions
    │   ├── config/            # Frontend config
    │   ├── App.jsx           # Main app component with routing
    │   ├── main.jsx          # React entry point
    │   └── index.css         # Global styles
    ├── public/                # Static assets
    ├── vite.config.js        # Vite configuration
    ├── tailwind.config.js    # Tailwind CSS config
    └── package.json
```

## 4. Key Features and Functionality

### Core Features

1. **Google Sheets-Driven CMS**
   - Products, settings, and configuration sync from Google Sheets every 5 minutes
   - Automatic periodic sync service runs on server startup
   - Admin can trigger manual sync from dashboard

2. **E-commerce Platform**
   - Product catalog with soft (digital) and physical products
   - Shopping cart and checkout flow
   - Razorpay payment integration
   - Order management with status tracking (pending → packed → shipped → out-for-delivery → delivered)
   - Digital product delivery via Google Drive links
   - Free and paid product support

3. **Book Publishing Platform**
   - eBook marketplace synced from Google Drive folders
   - Built-in book reader with chapter navigation
   - Book purchase system with access control
   - Soft copy (PDF/digital) and hard copy support
   - Like/view tracking

4. **Blog System**
   - Blog posts synced from Google Docs/DOCX files in Google Drive
   - Rich content with embedded images
   - Comments system with admin moderation
   - Like functionality
   - SEO optimization

5. **Booking/Reservation System**
   - Room booking with calendar integration
   - Google Calendar event creation
   - Payment integration
   - Multi-adult booking support
   - Availability checking

6. **CRM System**
   - Contact management with company details
   - Business card image upload via Cloudinary
   - AI-powered visiting card OCR (extract email from card images)
   - Follow-up tracking
   - Demo scheduling
   - Status updates and comments

7. **Email Campaign Management**
   - Campaign creation wizard (5-step process)
   - Google Docs integration for email content
   - AI-powered content and subject generation (Google Gemini)
   - Recipient management from CRM
   - Test email functionality
   - Email tracking (sent count, statistics)
   - User-specific email configuration

8. **Dynamic Portfolio Generator**
   - Multiple portfolio templates (Basic, Intermediate, Purplish)
   - Settings-driven portfolio selection
   - Dynamic data from Google Sheets

9. **Cold Email Tool**
   - Website scraping for contact information
   - Email extraction and storage

10. **User Authentication & Authorization**
    - Firebase Authentication (email/password)
    - Role-based access control (admin/user)
    - Protected routes and API endpoints

## 5. Database Schema/Models

### User Management
- **User**: User accounts with Firebase UID, role (admin/user), email statistics

### Products & E-commerce
- **ProductsFromSheets**: Products synced from Google Sheets (title, price, images, status, product type)
- **Products**: Legacy product model
- **Order**: Customer orders with product/book info, payment details, delivery status, solution link management
- **Cart**: Shopping cart items
- **BookPurchase**: Track book purchases for access control

### Content Management
- **Blog**: Blog posts synced from Google Drive (title, slug, content, images, likes, views, SEO)
- **Book**: eBooks synced from Google Drive folders (chapters, pricing, access control, stats)
- **Comment**: Blog comments with admin moderation

### Site Structure
- **Settings**: Dynamic settings synced from Google Sheets (stored as flexible key-value pairs)
- **HeroSection**: Homepage hero content
- **Navigation**: Dynamic navigation menu
- **SubNavbar**: Secondary navigation
- **Footer**: Footer content and links
- **Portfolio**: Portfolio data

### Booking System
- **Booking**: Room/service bookings with payment, calendar integration, multi-adult support

### CRM & Email Marketing
- **CRM**: Contact management with company details, images, follow-ups, demo tracking
- **EmailCampaign**: Email campaigns with recipients, content, status tracking
- **EmailConfig**: User-specific email configuration for sending campaigns

### Contact
- **Contact**: Contact form submissions

## 6. API Endpoints

All API endpoints are prefixed with `/api`

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/blog` - List blogs
- `GET /api/books` - List books
- `POST /api/contact-form/submit` - Submit contact form
- `GET /api/portfolio/*` - Portfolio data

### Authentication
- `POST /api/auth/login` - User login with Firebase token
- `GET /api/auth/user/:uid` - Get user details

### Products
- `GET /api/products` - Get all products (synced from Sheets)
- Protected admin endpoints for product management

### Orders
- `POST /api/checkout` - Create free order
- `GET /api/orders` - List orders (admin)
- `GET /api/orders/user/:email` - User's orders
- `GET /api/orders/my-purchases` - User's purchased items
- `PATCH /api/orders/:id/status` - Update order status (admin)
- `POST /api/orders/:id/solution/enable` - Enable solution link (admin)
- `GET /api/orders/solution/:token` - Access solution file

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify Razorpay payment

### Books
- `GET /api/books` - List books
- `GET /api/books/:slug` - Get book by slug
- `POST /api/books/:id/purchase` - Purchase book (free)
- `GET /api/books/admin/all` - Admin: List all books
- `POST /api/books/admin/sync` - Admin: Sync from Google Drive
- `DELETE /api/books/admin/:id` - Admin: Delete book

### Blog
- `GET /api/blog` - List blogs
- `GET /api/blog/:slug` - Get blog by slug
- `POST /api/blog/:id/like` - Like blog
- `POST /api/blog/admin/sync` - Admin: Sync from Google Drive
- `DELETE /api/blog/admin/:id` - Admin: Delete blog

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (admin)
- `GET /api/bookings/user/:email` - User bookings
- `GET /api/bookings/available-dates` - Check availability
- `POST /api/bookings/:id/payment` - Process booking payment

### Email Campaigns
- `GET /api/email-campaigns` - List campaigns (requires auth)
- `POST /api/email-campaigns` - Create campaign (requires auth)
- `POST /api/email-campaigns/generate-content` - AI content generation
- `POST /api/email-campaigns/generate-subject` - AI subject generation
- `POST /api/email-campaigns/extract-email-from-card` - OCR for business cards
- `POST /api/email-campaigns/send-test` - Send test email
- `POST /api/email-campaigns/create-and-send` - Create and send campaign
- `GET /api/email-campaigns/crm-entries` - List CRM contacts
- `POST /api/email-campaigns/crm-entries` - Create CRM contact
- `PUT /api/email-campaigns/crm-entries/:id` - Update CRM contact
- `DELETE /api/email-campaigns/crm-entries/:id` - Delete CRM contact

### Email Configuration
- `GET /api/email-config` - Get user's email config
- `POST /api/email-config` - Save email config
- `POST /api/email-config/test` - Test email configuration

### Cart
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/add` - Add to cart
- `DELETE /api/cart/:userId/item/:itemId` - Remove from cart
- `PUT /api/cart/:userId/item/:itemId` - Update cart item
- `DELETE /api/cart/:userId/clear` - Clear cart

### Sync
- `POST /api/sync/all` - Trigger manual sync from Google Sheets (admin)
- `GET /api/sync/status` - Get sync status

### Settings
- `GET /api/settings` - Get site settings
- `PUT /api/settings` - Update settings (admin)

### Upload
- `POST /api/upload/image` - Upload image to Cloudinary

### Chatbot
- `POST /api/chatbot/chat` - Chat with AI bot

### Cold Email
- `POST /api/cold-email/scrape` - Scrape website for emails

## 7. Notable Patterns and Architectural Decisions

### 1. Google Sheets as CMS
The most unique architectural decision is using Google Sheets as the primary data source for products, settings, and configuration. This allows non-technical users to manage content directly in familiar spreadsheet software. A periodic sync service runs every 5 minutes to keep MongoDB in sync.

### 2. Google Drive for Content Management
Blogs are created as Google Docs/DOCX files, and books are organized in Google Drive folders. The system automatically syncs, converts, and serves this content.

### 3. Dual Storage Pattern
- **Primary Source**: Google Sheets/Drive (easy content management)
- **Performance Cache**: MongoDB (fast queries, indexing)
- **Sync Service**: Keeps both in sync automatically

### 4. Firebase Authentication with Role-Based Access
- Frontend: Firebase Client SDK for authentication
- Backend: Firebase Admin SDK for token verification
- Custom middleware for admin role checking

### 5. Context-Based State Management
The frontend uses React Context API extensively (9 contexts) for:
- Authentication state
- Shopping cart
- Navigation (dynamic from Google Sheets)
- Brand settings
- Footer content

All contexts fetch data from the API and provide it to components.

### 6. Modular Controller-Service Pattern
- **Controllers** handle HTTP requests/responses
- **Services** contain business logic and external API integrations
- Clear separation of concerns

### 7. Soft Delete and Cascade Operations
Order deletion triggers cascade delete of related BookPurchase records to maintain data integrity.

### 8. Solution Access Control
Digital products use a token-based access system:
- Orders have unique access tokens
- Solution links are enabled/disabled by admin
- Access tracking (last accessed timestamp)

### 9. AI Integration
Google Generative AI (Gemini) is used for:
- Email content generation
- Subject line generation
- Business card OCR (extract contact info from images)

### 10. Environment-Based Configuration
Both frontend and backend use `.env` files for configuration. The frontend uses Vite's `import.meta.env` for environment variables.

### 11. Periodic Background Jobs
The server automatically starts a periodic sync service on startup that syncs data from Google Sheets every 5 minutes.

### 12. Multi-Currency Support
Products and books support both INR and USD pricing.

### 13. Multiple Product Types
Products can be:
- Soft (digital only)
- Physical (shipped items)
- Physical + Soft (hybrid)

### 14. CORS Configuration
The backend allows multiple origins for development and production:
- localhost:5173, 5174, 3000
- sheetsprojects.com
- Netlify deployment URLs

### 15. File Upload Strategy
- Images: Cloudinary CDN
- Documents: Google Drive
- Temporary uploads: Local `uploads/` directory

## 8. Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)
- Firebase project with Authentication enabled
- Google Cloud Project with Sheets, Drive, and Calendar APIs enabled
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required variables (see section 5)
npm run dev  # Development mode with auto-reload
npm start    # Production mode
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL and Firebase config (see section 5)
npm run dev  # Development server (usually http://localhost:5173)
npm run build  # Production build
npm run preview  # Preview production build
```

### Initial Configuration

1. **Set up Firebase project**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Email/Password authentication
   - Download service account credentials (for backend)
   - Get web app config (for frontend)

2. **Create Google Sheets**
   - Create a sheet for products
   - Create a sheet for settings
   - Share both sheets with Firebase service account email (give editor access)

3. **Set up Google Drive**
   - Create folders for blogs and books
   - Share with Firebase service account email

4. **Configure environment variables**
   - Set up `.env` files in both `backend/` and `frontend/`
   - Add all required API keys and credentials

5. **Run the application**
   - Start backend server first
   - Start frontend development server
   - The sync service will automatically populate data from Google Sheets

### Development Workflow

1. **Making changes to products/settings**: Edit the Google Sheets directly. Changes will sync within 5 minutes, or trigger manual sync from admin dashboard.

2. **Adding blog posts**: Upload DOCX files to the configured Google Drive folder and sync from admin panel.

3. **Adding books**: Create folder structure in Google Drive with chapters and sync from admin panel.

4. **Testing payments**: Use Razorpay test mode credentials and test card numbers.

5. **Admin access**: Create a user account, then manually update the user's role to 'admin' in the MongoDB database.

## 10. Common Tasks

### How to add a new product
1. Open the products Google Sheet
2. Add a new row with product details
3. Wait for automatic sync (5 min) or trigger manual sync from dashboard

### How to add a new blog post
1. Create a DOCX file with your blog content
2. Upload to the configured Google Drive folder
3. Go to admin dashboard → Sync Blogs

### How to add a new book
1. Create a folder in Google Drive with the book name
2. Add chapter files (DOCX format)
3. Go to admin dashboard → Sync Books

### How to update site settings
1. Open the settings Google Sheet
2. Modify values in the sheet
3. Changes will sync automatically

### How to make a user an admin
```bash
# Connect to MongoDB and update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

## 11. Troubleshooting

### Sync not working
- Check if Google Sheets are shared with the service account email
- Verify SHEET_ID environment variables are correct
- Check backend logs for Google API errors

### Authentication issues
- Verify Firebase config matches between frontend and backend
- Check if Firebase service account credentials are valid
- Ensure Firebase Authentication is enabled in console

### Images not uploading
- Verify Cloudinary credentials in `.env`
- Check Cloudinary account upload limits

### Payment not working
- Verify Razorpay credentials
- Check if using test/production mode correctly
- Review Razorpay dashboard for transaction logs

## 12. Deployment

### Backend Deployment
- Ensure all environment variables are set on hosting platform
- MongoDB connection string should point to production database
- Set `NODE_ENV=production`

### Frontend Deployment
- Build the project: `npm run build`
- Deploy the `dist/` folder to hosting service (Netlify, Vercel, etc.)
- Update `VITE_API_URL` to point to production backend

### Important Notes
- Update CORS settings in backend to include production domain
- Set up proper MongoDB indexes for production
- Enable Firebase security rules
- Use production keys for Razorpay, Cloudinary
- Set up proper Google Cloud API quotas and billing

---

