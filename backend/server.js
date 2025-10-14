import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import "./config/firebase.js"; 
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://sheetsprojects.com",
      "www.sheetsprojects.com",
      "https://sheetsprojects.netlify.app",
      "https://sheetsprojectsdemo.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Serve portfolio static files
const portfolioDir = path.join(__dirname, "..", "portfolio");
app.use("/portfolio", express.static(portfolioDir));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Import sync service to start periodic sync
import syncService from './services/syncService.js';

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start periodic sync on server startup
  console.log('Starting periodic sync service...');
  try {
    syncService.startPeriodicSync(5); // Sync every 5 minutes
    console.log('✅ Periodic sync service started successfully');
  } catch (error) {
    console.error('❌ Failed to start periodic sync service:', error.message);
  }
});
