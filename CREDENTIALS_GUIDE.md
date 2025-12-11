# 🔐 Complete Credentials Guide for Sheets Projects

This guide lists **ALL** credentials needed to run this project from scratch.

---

## 📋 Table of Contents
1. [Client Credentials (Frontend)](#client-credentials-frontend)
2. [Server Credentials (Backend)](#server-credentials-backend)
3. [Step-by-Step Setup Instructions](#step-by-step-setup-instructions)

---

## 🌐 Client Credentials (Frontend)

**File Location:** `sheets-web/.env`

### Required Environment Variables:

```env
# 1. Backend API URL
VITE_API_URL=http://localhost:5004/api
# For production: https://your-backend-domain.com/api

# 2. Firebase Authentication (Get from Firebase Console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=

# 3. Google API Key (Get from Google Cloud Console)
VITE_GOOGLE_API_KEY=

# 4. Google reCAPTCHA (Get from Google reCAPTCHA Admin)
VITE_RECAPTCHA_SITE_KEY=

# 5. Google Drive API Key (Get from Google Cloud Console)
VITE_GOOGLE_DRIVE_API_KEY=
```

---

## 🖥️ Server Credentials (Backend)

**File Location:** `sheets-api/.env`

### Required Environment Variables:

```env
# 1. Server Configuration
PORT=5004

# 2. MongoDB Database (Get from MongoDB Atlas)
MONGODB_URI=

# 3. Cloudinary (Image/File Storage) - Get from Cloudinary Dashboard
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=

# 4. Email Configuration (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# 5. Firebase Admin SDK (Get from Firebase Console)
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=
FIREBASE_CLIENT_X509_CERT_URL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PROJECT_ID=
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# 6. Google Service Account Key File Path
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/service-account-key.json

# 7. Google reCAPTCHA (Get from Google reCAPTCHA Admin)
RECAPTCHA_SECRET_KEY=
RECAPTCHA_SITE_KEY=

# 8. Razorpay Payment Gateway (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# 9. Google Sheets IDs (Create your own Google Sheets)
PRODUCTS_SHEET_ID=
SETTINGS_SHEET_ID=
SETTINGS_SHEET_NAME=Settings
CONTACT_SHEET_ID=
BOOKINGS_SHEET_ID=

# 10. Google Drive Folder IDs (Create folders in Google Drive)
BLOGS_FOLDER_ID=
BOOKS_FOLDER_ID=
PORTFOLIO_TEMPLATES_FOLDER_ID=
BASIC_PORTFOLIO_TEMPLATE_ID=

# 11. Google Calendar IDs (Create calendars in Google Calendar)
ROOM_1_CALENDAR_ID=
ROOM_2_CALENDAR_ID=
ROOM_3_CALENDAR_ID=

# 12. Google Custom Search (Get from Google Cloud Console)
GOOGLE_CUSTOM_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=

# 13. Gemini AI API Key (Get from Google AI Studio)
GEMINI_API_KEY=
```

---

## 📚 Step-by-Step Setup Instructions

### 1️⃣ Firebase Setup (Required)
**Purpose:** User authentication

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing
3. Enable **Authentication** → **Sign-in method** → Enable Google & Email/Password
4. Go to **Project Settings** → **General**
5. Scroll to "Your apps" → Click **Web** icon
6. Register your app and copy all config values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

**For Backend (Admin SDK):**
7. Go to **Project Settings** → **Service accounts**
8. Click **Generate new private key**
9. Save the JSON file to `sheets-api/config/service-account-key.json`
10. Copy values from JSON to backend .env:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

---

### 2️⃣ Google Cloud Console Setup (Required)
**Purpose:** Google APIs, Drive, Sheets access

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
   - Google Calendar API (if using bookings)
   - Custom Search API (if using search)

4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key:
   - Use for `VITE_GOOGLE_API_KEY`
   - Use for `VITE_GOOGLE_DRIVE_API_KEY`
   - Use for `GOOGLE_CUSTOM_SEARCH_API_KEY` (if different)

6. For Service Account (already created with Firebase):
   - Use the same JSON file downloaded from Firebase
   - Set path: `GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/service-account-key.json`

---

### 3️⃣ MongoDB Atlas Setup (Required)
**Purpose:** Database for storing users, products, orders

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a new cluster (Free M0 tier available)
4. Click **Connect** → **Connect your application**
5. Copy connection string → `MONGODB_URI`
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with your database name

---

### 4️⃣ Cloudinary Setup (Required)
**Purpose:** Image and file storage

1. Go to https://cloudinary.com/
2. Sign up for free account
3. Go to Dashboard
4. Copy:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

---

### 5️⃣ Google reCAPTCHA Setup (Required)
**Purpose:** Bot protection for forms

1. Go to https://www.google.com/recaptcha/admin
2. Register a new site
3. Choose **reCAPTCHA v2** → "I'm not a robot" Checkbox
4. Add your domains (localhost, your-domain.com)
5. Copy:
   - Site Key → `VITE_RECAPTCHA_SITE_KEY` (frontend)
   - Site Key → `RECAPTCHA_SITE_KEY` (backend)
   - Secret Key → `RECAPTCHA_SECRET_KEY` (backend only)

---

### 6️⃣ Gmail App Password Setup (Required for Email)
**Purpose:** Sending emails (contact forms, notifications)

1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to **App passwords**
4. Generate new app password for "Mail"
5. Copy:
   - Your Gmail → `EMAIL_USER`
   - Generated password → `EMAIL_PASSWORD`

---

### 7️⃣ Google Sheets Setup (Required)
**Purpose:** Dynamic content management

1. Create the following Google Sheets:
   - **Products Sheet** - For managing products
   - **Settings Sheet** - For site configuration (name "Settings")
   - **Contact Sheet** - For contact form submissions
   - **Bookings Sheet** - For booking management (if using)

2. For each sheet:
   - Click **Share** → Share with your service account email
   - Give **Editor** permissions
   - Copy the Sheet ID from URL:
     - URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

3. Set the IDs:
   - `PRODUCTS_SHEET_ID=`
   - `SETTINGS_SHEET_ID=`
   - `CONTACT_SHEET_ID=`
   - `BOOKINGS_SHEET_ID=`

---

### 8️⃣ Google Drive Folders Setup (Optional)
**Purpose:** File organization for blogs, books, portfolios

1. Create folders in Google Drive:
   - Blogs folder
   - Books folder
   - Portfolio Templates folder

2. For each folder:
   - Right-click → **Share** → Share with service account email (Editor)
   - Copy Folder ID from URL:
     - URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

3. Set the IDs:
   - `BLOGS_FOLDER_ID=`
   - `BOOKS_FOLDER_ID=`
   - `PORTFOLIO_TEMPLATES_FOLDER_ID=`

---

### 9️⃣ Razorpay Setup (Optional - for Payments)
**Purpose:** Payment processing

1. Go to https://razorpay.com/
2. Sign up and verify account
3. Go to **Settings** → **API Keys**
4. Generate test/live keys:
   - Key ID → `RAZORPAY_KEY_ID`
   - Key Secret → `RAZORPAY_KEY_SECRET`

---

### 🔟 Gemini AI Setup (Optional - for AI features)
**Purpose:** AI-powered features

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy → `GEMINI_API_KEY`

---

## ✅ Checklist

### Minimum Required (to run basic project):
- [ ] Firebase (Frontend & Backend)
- [ ] MongoDB Atlas
- [ ] Cloudinary
- [ ] Gmail App Password
- [ ] Google Cloud APIs enabled
- [ ] reCAPTCHA
- [ ] Google Sheets (Settings, Products)

### Optional (for advanced features):
- [ ] Razorpay (for payments)
- [ ] Google Calendar (for bookings)
- [ ] Google Drive folders (for file management)
- [ ] Gemini AI (for AI features)
- [ ] Custom Search (for search functionality)

---

## 🚀 Quick Start Commands

After setting up all credentials:

```bash
# 1. Install dependencies
cd sheets-api && npm install
cd ../sheets-web && npm install

# 2. Start backend server
cd sheets-api && npm start

# 3. Start frontend (in new terminal)
cd sheets-web && npm run dev
```

---

## ⚠️ Important Security Notes

1. **NEVER commit .env files to Git**
2. All `VITE_*` variables are exposed in frontend bundle - don't use secrets
3. Backend secrets (MONGODB_URI, API secrets) must stay server-side only
4. Always use different credentials for development and production
5. Regularly rotate API keys and passwords
6. Enable 2FA on all service accounts

---

## 📞 Need Help?

If you're stuck on any credential setup:
1. Check the official documentation for each service
2. Ensure all APIs are enabled in Google Cloud Console
3. Verify service account has proper permissions on Sheets/Drive
4. Check that all .env files are in the correct locations

---

**Last Updated:** November 2025
**Project:** Sheets Projects - Full Stack Application
