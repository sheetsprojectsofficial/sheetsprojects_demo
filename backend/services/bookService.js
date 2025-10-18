import { google } from 'googleapis';
import mammoth from 'mammoth';
import Book from '../models/Book.js';
import { fetchBookSettingsFromSheet } from '../config/googlesheets.js';

const authenticateGoogleDrive = () => {
  const credentials = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const findFileByName = (files, namePattern, isImage = false) => {
  if (isImage) {
    // Look for image files (jpeg, jpg, png, etc.)
    return files.find(file => 
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name) && 
      !file.name.startsWith('~$') // Exclude temp files
    );
  } else {
    // Look for Google Docs or document files matching the pattern
    const patterns = namePattern ? [namePattern.toLowerCase()] : [];
    
    // Add common variations
    if (namePattern === 'excerpt') {
      patterns.push('summary', 'description', 'intro', 'overview');
    } else if (namePattern === 'chapters') {
      patterns.push('content', 'text', 'body', 'main', 'book', 'story');
    }
    
    return files.find(file => {
      const fileName = file.name.toLowerCase();
      const isDocument = file.mimeType === 'application/vnd.google-apps.document' || 
                        /\.(doc|docx)$/i.test(file.name);
      const isNotTemp = !file.name.startsWith('~$');
      
      if (!isDocument || !isNotTemp) return false;
      
      // If no pattern specified, return first valid document
      if (!namePattern) return true;
      
      // Check if filename contains any of the pattern variations
      return patterns.some(pattern => fileName.includes(pattern));
    });
  }
};

const convertDocToHtml = async (drive, fileId, fileName, mimeType) => {
  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc as HTML
      const fileResponse = await drive.files.export({
        fileId: fileId,
        mimeType: 'text/html'
      });
      return fileResponse.data;
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Download and convert DOCX/DOC files using mammoth
      const fileResponse = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      const result = await mammoth.convertToHtml({
        buffer: Buffer.from(fileResponse.data)
      });
      return result.value;
    }
    return '';
  } catch (error) {
    console.error(`Error converting ${fileName}:`, error);
    return '';
  }
};

const generateDirectImageUrl = (fileId) => {
  // Use Google Drive's public thumbnail API directly (no backend proxy needed)
  // This is more reliable and doesn't require authentication
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
};

const convertGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') {
    console.log(`❌ Invalid URL provided for conversion: ${url}`);
    return url;
  }
  
  console.log(`🔍 Processing URL for Drive conversion: ${url}`);
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com/uc?export=view')) {
    console.log(`✅ URL is already in direct format`);
    return url;
  }
  
  // Enhanced pattern to match various Google Drive URL formats
  const driveUrlPatterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^?]*)?(?:\?[^&]*)?(?:&[^&]*)*/, // Matches /view, /edit, etc.
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, // Old format with ?id=
  ];
  
  for (const pattern of driveUrlPatterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      console.log(`🔗 Converting Google Drive sharing URL to direct image URL`);
      console.log(`   Original: ${url}`);
      console.log(`   File ID: ${fileId}`);
      
      // Try multiple formats for better compatibility
      // Method 1: Standard Google Drive export format  
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      // Method 2: Google User Content format (often works better for images)
      const alternativeUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1000?authuser=0`;
      // Method 3: Drive thumbnail format
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      
      console.log(`   Direct URL (primary): ${directUrl}`);
      console.log(`   Alternative URL (googleusercontent): ${alternativeUrl}`);
      console.log(`   Thumbnail URL: ${thumbnailUrl}`);
      
      // Try the googleusercontent format first as it often works better for public images
      return alternativeUrl;
    }
  }
  
  // If it's not a Google Drive URL, return as is
  console.log(`ℹ️  Not a Google Drive URL, returning as-is`);
  return url;
};

const findSettingsFile = (files) => {
  // Look for Google Sheets or Excel files that contain "settings" in the name
  return files.find(file => {
    const fileName = file.name.toLowerCase();
    const isSpreadsheet = file.mimeType === 'application/vnd.google-apps.spreadsheet' || 
                         /\.(xlsx|xls)$/i.test(file.name);
    const containsSettings = fileName.includes('settings') || fileName.includes('setting');
    const isNotTemp = !file.name.startsWith('~$');
    
    return isSpreadsheet && containsSettings && isNotTemp;
  });
};

const readBookSettings = async (drive, settingsFile) => {
  try {
    if (!settingsFile) return {};
    
    console.log(`Reading settings from ${settingsFile.name} (${settingsFile.mimeType})`);
    
    if (settingsFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
      // It's a Google Sheets file - use the fetchBookSettingsFromSheet function
      try {
        const settings = await fetchBookSettingsFromSheet(settingsFile.id, 'Sheet1');
        console.log(`Successfully read settings from ${settingsFile.name}:`, settings);
        return settings;
      } catch (error) {
        console.error(`Error reading Google Sheet settings from ${settingsFile.name}:`, error);
        return {};
      }
    } else if (/\.(xlsx|xls)$/i.test(settingsFile.name)) {
      // It's an Excel file - for now, we'll skip these and focus on Google Sheets
      console.log(`Skipping Excel file ${settingsFile.name} - only Google Sheets are supported currently`);
      return {};
    }
    
    return {};
  } catch (error) {
    console.error(`Error reading settings file ${settingsFile.name}:`, error);
    return {};
  }
};

const parsePrice = (priceString) => {
  if (!priceString || priceString === 'NULL' || priceString === 'null') return 0;
  
  // Extract numeric value from strings like "USD 20", "$20", "20"
  const numericMatch = priceString.toString().match(/[\d.]+/);
  return numericMatch ? parseFloat(numericMatch[0]) : 0;
};

const parseCurrency = (priceString) => {
  if (!priceString || priceString === 'NULL' || priceString === 'null') return 'USD';
  
  // Extract currency from strings like "USD 20", "$20"
  const str = priceString.toString().toUpperCase();
  if (str.includes('USD')) return 'USD';
  if (str.includes('EUR')) return 'EUR';
  if (str.includes('GBP')) return 'GBP';
  if (str.includes('INR')) return 'INR';
  if (str.includes('$')) return 'USD';
  
  return 'USD'; // Default currency
};

const getPricingInfo = (bookSettings) => {
  const hardCopyAvailable = bookSettings['hard copy available'] || bookSettings['hard copy avail'];
  const softCopyPrice = bookSettings['soft copy price'];
  const hardCopyPrice = bookSettings['hard copy price'];
  
  const pricing = {
    softCopy: {
      available: true, // Always available as per requirements
      price: softCopyPrice && softCopyPrice !== 'NULL' && softCopyPrice !== '' ? softCopyPrice : 'Free',
      displayText: '',
      rawValue: softCopyPrice
    },
    hardCopy: {
      available: hardCopyAvailable === 'Yes' || hardCopyAvailable === 'yes' || hardCopyAvailable === 'YES',
      price: hardCopyPrice && hardCopyPrice !== 'NULL' && hardCopyPrice !== '' ? hardCopyPrice : null,
      displayText: '',
      availabilityText: '',
      rawValue: hardCopyPrice
    },
    // Store all raw field values for NULL handling
    rawFields: {
      'Book name': bookSettings['Book name'],
      'language': bookSettings['language'],
      'release date': bookSettings['release date'],
      'hard copy available': hardCopyAvailable,
      'soft copy price': softCopyPrice,
      'hard copy price': hardCopyPrice,
      'Image': bookSettings['Image']
    }
  };

  // Set soft copy display text
  if (softCopyPrice && softCopyPrice !== 'NULL' && softCopyPrice !== '') {
    pricing.softCopy.displayText = softCopyPrice;
  } else if (softCopyPrice === 'NULL' || softCopyPrice === 'null') {
    pricing.softCopy.displayText = 'Soft Copy Price - NULL';
  } else {
    pricing.softCopy.displayText = 'Soft Copy - Free';
  }

  // Set hard copy display text based on availability
  if (pricing.hardCopy.available) {
    pricing.hardCopy.availabilityText = 'Hard Copy Available';
    if (hardCopyPrice && hardCopyPrice !== 'NULL' && hardCopyPrice !== '') {
      pricing.hardCopy.displayText = hardCopyPrice;
    } else if (hardCopyPrice === 'NULL' || hardCopyPrice === 'null') {
      pricing.hardCopy.displayText = 'Hard Copy Price - NULL';
    } else {
      pricing.hardCopy.displayText = 'Hard Copy Price - NULL';
    }
  } else {
    pricing.hardCopy.availabilityText = 'Hard Copy Not Available';
    pricing.hardCopy.displayText = 'Hard Copy Not Available';
  }

  return pricing;
};

export const fetchBooksFromDrive = async () => {
  try {
    console.log('Fetching books from Google Drive...');
    
    const drive = authenticateGoogleDrive();
    const booksFolderId = process.env.BOOKS_FOLDER_ID;
    
    if (!booksFolderId) {
      throw new Error('BOOKS_FOLDER_ID is not set in environment variables');
    }

    // List all folders in the books folder (each folder represents a book)
    const foldersResponse = await drive.files.list({
      q: `'${booksFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    const bookFolders = foldersResponse.data.files;
    console.log(`Found ${bookFolders.length} book folders in Drive`);

    const books = [];
    console.log(`📚 Found ${bookFolders.length} book folders to process:`, bookFolders.map(f => f.name));

    for (const folder of bookFolders) {
      try {
        console.log(`Processing book folder: ${folder.name}`);
        
        // List all files in this book folder
        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, modifiedTime)',
        });

        const files = filesResponse.data.files;
        console.log(`Found ${files.length} files in ${folder.name}`);

        // Find cover image (any image file)
        const coverImageFile = findFileByName(files, '', true);
        
        // Find excerpt file
        let excerptFile = findFileByName(files, 'excerpt');
        
        // Find chapters file  
        let chaptersFile = findFileByName(files, 'chapters');
        
        // Find settings file (Google Sheets or Excel)
        const settingsFile = findSettingsFile(files);
        console.log(`Settings file for ${folder.name}:`, settingsFile ? settingsFile.name : 'None found');
        
        // If we couldn't find specific files, try to find any document files
        if (!excerptFile && !chaptersFile) {
          const docFiles = files.filter(file => 
            (file.mimeType === 'application/vnd.google-apps.document' || 
             /\.(doc|docx)$/i.test(file.name)) && 
            !file.name.startsWith('~$')
          );
          
          if (docFiles.length >= 1) {
            excerptFile = docFiles[0];
            if (docFiles.length >= 2) {
              chaptersFile = docFiles[1];
            }
          }
        }

        // Log what files were found
        console.log(`Files found in ${folder.name}:`);
        console.log(`- Cover image file: ${coverImageFile ? coverImageFile.name : 'None'}`);
        console.log(`- Excerpt file: ${excerptFile ? excerptFile.name : 'None'}`);
        console.log(`- Chapters file: ${chaptersFile ? chaptersFile.name : 'None'}`);
        console.log(`- Settings file: ${settingsFile ? settingsFile.name : 'None'}`);
        
        if (!excerptFile && !chaptersFile) {
          console.warn(`Skipping ${folder.name}: No content files found (excerpt or chapters)`);
          continue;
        }

        // Convert excerpt and chapters to HTML
        console.log(`Converting documents for ${folder.name}...`);
        
        let excerptHtml = '';
        let chaptersHtml = '';
        
        if (excerptFile) {
          excerptHtml = await convertDocToHtml(drive, excerptFile.id, excerptFile.name, excerptFile.mimeType);
        }
        
        if (chaptersFile) {
          chaptersHtml = await convertDocToHtml(drive, chaptersFile.id, chaptersFile.name, chaptersFile.mimeType);
        }
        
        // If we don't have excerpt, use the beginning of chapters as excerpt
        if (!excerptHtml && chaptersHtml) {
          excerptHtml = chaptersHtml.substring(0, 2000);
        }
        
        // If we don't have chapters, use excerpt as chapters
        if (!chaptersHtml && excerptHtml) {
          chaptersHtml = excerptHtml;
        }
        
        if (!excerptHtml && !chaptersHtml) {
          console.warn(`Skipping ${folder.name}: No content could be extracted`);
          console.log(`- excerptHtml length: ${excerptHtml ? excerptHtml.length : 0}`);
          console.log(`- chaptersHtml length: ${chaptersHtml ? chaptersHtml.length : 0}`);
          continue;
        }
        
        console.log(`Content extraction successful for ${folder.name}:`);
        console.log(`- excerptHtml length: ${excerptHtml ? excerptHtml.length : 0}`);
        console.log(`- chaptersHtml length: ${chaptersHtml ? chaptersHtml.length : 0}`);

        // Generate clean excerpt text (remove HTML tags for excerpt field)
        const excerptText = excerptHtml
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500);
        
        console.log(`Excerpt for ${folder.name}: Generated from Drive files (${excerptText.length} characters)`);

        // Read settings from the settings file (if found)
        let bookSettings = {};
        if (settingsFile) {
          console.log(`Reading settings for ${folder.name}...`);
          bookSettings = await readBookSettings(drive, settingsFile);
          console.log(`Settings for ${folder.name}:`, JSON.stringify(bookSettings, null, 2));
        }

        // Use book name from settings if available, otherwise use folder name
        const title = bookSettings['Book name'] || bookSettings['book name'] || bookSettings['title'] || folder.name;
        const slug = generateSlug(title);
        
        console.log(`Book title: ${title} (from ${bookSettings['Book name'] ? 'settings' : 'folder name'})`);

        // Generate pricing information
        const pricingInfo = getPricingInfo(bookSettings);
        console.log(`Pricing info for ${title}:`, JSON.stringify(pricingInfo, null, 2));

        // Handle cover image - prioritize Image field from sheet, fallback to Drive file
        let coverImageUrl;
        if (bookSettings['Image'] && bookSettings['Image'] !== 'NULL' && bookSettings['Image'] !== '') {
          // Use image from Google Sheets and convert Google Drive sharing URLs to direct URLs
          const originalUrl = bookSettings['Image'];
          coverImageUrl = convertGoogleDriveUrl(originalUrl);
          console.log(`Cover image for ${title}: Using image from sheet - ${originalUrl}`);
          if (originalUrl !== coverImageUrl) {
            console.log(`Cover image URL converted for display: ${coverImageUrl}`);
          }
        } else if (coverImageFile) {
          // Fallback to Drive file
          coverImageUrl = generateDirectImageUrl(coverImageFile.id);
          console.log(`Cover image for ${title}: Using image from Drive file - ${coverImageFile.name}`);
        } else {
          // No image available - use default
          console.log(`Cover image for ${title}: No image available, using default`);
          coverImageUrl = '/default-book-cover.jpg'; // Default placeholder image
        }

        // Create book object
        const bookData = {
          title,
          slug,
          excerpt: excerptText,
          coverImage: coverImageUrl,
          chapters: chaptersHtml,
          driveFolderId: folder.id,
          driveFolderName: folder.name,
          driveFiles: {
            coverImageId: coverImageFile.id,
            excerptId: excerptFile?.id || null,
            chaptersId: chaptersFile?.id || null,
            settingsId: settingsFile?.id || null
          },
          // Apply settings from the Excel file, with defaults
          author: bookSettings['author'] || bookSettings['Author'] || 'Admin',
          category: bookSettings['category'] || bookSettings['Category'] || 'Book',
          status: 'published',
          // Check if book is paid based on soft copy price
          isPaid: pricingInfo.softCopy.price !== 'Free',
          price: parsePrice(pricingInfo.softCopy.price || '0'),
          currency: parseCurrency(pricingInfo.softCopy.price || 'USD 0'),
          // Store all raw settings data
          bookSettings: bookSettings,
          // Store processed pricing information
          pricingInfo: pricingInfo
        };

        books.push(bookData);
        console.log(`✅ Successfully processed: ${title}`);
        console.log(`   - Slug: ${slug}`);
        console.log(`   - Cover Image URL: ${coverImageUrl}`);
        console.log(`   - Original Image from Sheet: ${bookSettings['Image'] || 'None'}`);
        console.log(`   - Pricing: Soft Copy - ${pricingInfo.softCopy.displayText}, Hard Copy - ${pricingInfo.hardCopy.displayText}`);
        console.log(`   - Settings fields: ${Object.keys(bookSettings).join(', ')}`);
        console.log(`   - Book data being saved:`, {
          title: bookData.title,
          coverImage: bookData.coverImage,
          isPaid: bookData.isPaid,
          price: bookData.price
        });
        
      } catch (fileError) {
        console.error(`Error processing book folder ${folder.name}:`, fileError);
      }
    }

    console.log(`Successfully processed ${books.length} books from Drive`);
    return books;

  } catch (error) {
    console.error('Error fetching books from Google Drive:', error);
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};

export const syncBooksFromDrive = async () => {
  try {
    const driveBooks = await fetchBooksFromDrive();
    const syncResults = await Book.syncFromDrive(driveBooks);
    
    console.log('Book sync completed:', syncResults);
    return {
      success: true,
      books: driveBooks,
      syncResults
    };
  } catch (error) {
    console.error('Error syncing books:', error);
    throw error;
  }
};

// Store view tracking in memory (in production, use Redis for better performance)
const viewTracker = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, timestamp] of viewTracker.entries()) {
    if (now - timestamp > oneHour) {
      viewTracker.delete(key);
    }
  }
}, 60 * 60 * 1000);

export const getBookBySlug = async (slug, userId = null) => {
  try {
    const book = await Book.findOne({ slug, status: 'published' });
    if (book && userId) {
      // Create a unique key for this user + book combination
      const viewKey = `${userId}_${book._id}`;
      const now = Date.now();
      const lastViewTime = viewTracker.get(viewKey);
      
      // Only increment view if user hasn't viewed this book in the last hour
      if (!lastViewTime || now - lastViewTime > 60 * 60 * 1000) {
        book.views += 1;
        await book.save();
        viewTracker.set(viewKey, now);
      }
    }
    return book;
  } catch (error) {
    console.error('Error fetching book by slug:', error);
    throw error;
  }
};

export const getLatestBooks = async (limit = 5, excludeSlug = null) => {
  try {
    const query = { status: 'published' };
    if (excludeSlug) {
      query.slug = { $ne: excludeSlug };
    }
    
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title slug excerpt coverImage createdAt views likes isPaid price currency');
    
    return books;
  } catch (error) {
    console.error('Error fetching latest books:', error);
    throw error;
  }
};

export const searchBooks = async (searchTerm, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const query = {
      status: 'published',
      $or: [
        { title: { $regex: searchRegex } },
        { excerpt: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        { category: { $regex: searchRegex } },
        { author: { $regex: searchRegex } }
      ]
    };
    
    const [books, total] = await Promise.all([
      Book.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug excerpt coverImage createdAt views likes category tags isPaid price currency'),
      Book.countDocuments(query)
    ]);
    
    return {
      books,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};