import Book from '../models/Book.js';
import BookPurchase from '../models/BookPurchase.js';
import Order from '../models/Order.js';
import { 
  syncBooksFromDrive, 
  getBookBySlug, 
  getLatestBooks, 
  searchBooks 
} from '../services/bookService.js';
import { fetchBookSettingsFromSheet } from '../config/googlesheets.js';

const bookController = {
  // Get all books (with pagination)
  getAllBooks: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const category = req.query.category;
      const isPaid = req.query.isPaid;

      let query = { status: 'published' };
      
      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { title: { $regex: searchRegex } },
          { excerpt: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } }
        ];
      }
      
      // Add category filter
      if (category) {
        query.category = category;
      }

      // Add paid/free filter
      if (isPaid !== undefined) {
        query.isPaid = isPaid === 'true';
      }

      const [books, total] = await Promise.all([
        Book.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('title slug excerpt coverImage createdAt views likes category tags author isPaid price currency likedBy bookSettings pricingInfo'),
        Book.countDocuments(query)
      ]);

      // If userId is provided in query, include liked status and purchase status for each book
      const userId = req.query.userId;
      if (userId) {
        const booksWithStatus = await Promise.all(books.map(async (book) => {
          const bookObj = book.toObject();
          bookObj.isLiked = book.likedBy.includes(userId);
          
          // Check if user has purchased this book (both paid and free books)
          bookObj.isPurchased = await BookPurchase.hasUserPurchased(userId, book._id);
          
          return bookObj;
        }));
        
        return res.json({
          success: true,
          books: booksWithStatus,
          pagination: {
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        });
      }

      res.json({
        success: true,
        books,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching books',
        error: error.message
      });
    }
  },

  // Get single book by slug
  getBookBySlug: async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.query.userId;
      
      const book = await getBookBySlug(slug, userId);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      let bookResponse = book.toObject();

      // If userId is provided, include liked status and purchase status
      if (userId) {
        bookResponse.isLiked = book.likedBy && book.likedBy.includes(userId);
        
        // Check if user has purchased this book (both paid and free books)
        bookResponse.isPurchased = await BookPurchase.hasUserPurchased(userId, book._id);
        
        // If not purchased, hide chapters
        if (!bookResponse.isPurchased) {
          delete bookResponse.chapters;
        }
      } else {
        // If no userId, hide chapters for all books
        delete bookResponse.chapters;
      }

      // Get related books (same category, excluding current book)
      const relatedBooks = await getLatestBooks(3, slug);

      res.json({
        success: true,
        book: bookResponse,
        relatedBooks
      });
    } catch (error) {
      console.error('Error fetching book by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching book',
        error: error.message
      });
    }
  },

  // Get single book by ID
  getBookById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId;
      
      const book = await Book.findById(id);
      
      if (!book || book.status !== 'published') {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      let bookResponse = book.toObject();

      // If userId is provided, include liked status and purchase status
      if (userId) {
        bookResponse.isLiked = book.likedBy && book.likedBy.includes(userId);
        
        // Check if user has purchased this book (both paid and free books)
        bookResponse.isPurchased = await BookPurchase.hasUserPurchased(userId, book._id);
        
        // If not purchased, hide chapters
        if (!bookResponse.isPurchased) {
          delete bookResponse.chapters;
        }
      } else {
        // If no userId, hide chapters for all books
        delete bookResponse.chapters;
      }

      res.json({
        success: true,
        book: bookResponse
      });
    } catch (error) {
      console.error('Error fetching book by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching book',
        error: error.message
      });
    }
  },

  // Get latest books
  getLatestBooks: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const books = await getLatestBooks(limit);

      res.json({
        success: true,
        books
      });
    } catch (error) {
      console.error('Error fetching latest books:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching latest books',
        error: error.message
      });
    }
  },

  // Search books
  searchBooks: async (req, res) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const results = await searchBooks(q, page, limit);

      res.json({
        success: true,
        ...results
      });
    } catch (error) {
      console.error('Error searching books:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching books',
        error: error.message
      });
    }
  },

  // Sync books from Google Drive
  syncFromDrive: async (req, res) => {
    try {
      console.log('Starting book sync from Google Drive...');
      
      const result = await syncBooksFromDrive();
      
      res.json({
        success: true,
        message: 'Books synced successfully from Google Drive',
        ...result
      });
    } catch (error) {
      console.error('Error syncing books from Google Drive:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing books from Google Drive',
        error: error.message
      });
    }
  },

  // Get books for admin panel
  getAdminBooks: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status || 'all';

      let query = {};
      if (status !== 'all') {
        query.status = status;
      }

      const [books, total] = await Promise.all([
        Book.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Book.countDocuments(query)
      ]);

      // Add purchase counts for each book
      const booksWithPurchases = await Promise.all(
        books.map(async (book) => {
          const purchaseCount = await BookPurchase.countDocuments({ 
            bookId: book._id,
            paymentStatus: 'completed'
          });
          return {
            ...book.toObject(),
            purchaseCount
          };
        })
      );

      res.json({
        success: true,
        books: booksWithPurchases,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page
        }
      });
    } catch (error) {
      console.error('Error fetching admin books:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching books for admin',
        error: error.message
      });
    }
  },

  // Create new book
  createBook: async (req, res) => {
    try {
      const bookData = req.body;
      
      // Generate slug from title if not provided
      if (!bookData.slug) {
        bookData.slug = bookData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }

      const book = new Book(bookData);
      await book.save();

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        book
      });
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating book',
        error: error.message
      });
    }
  },

  // Update book
  updateBook: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const book = await Book.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        message: 'Book updated successfully',
        book
      });
    } catch (error) {
      console.error('Error updating book:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating book',
        error: error.message
      });
    }
  },

  // Delete book
  deleteBook: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findByIdAndDelete(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Also delete all purchases for this book
      await BookPurchase.deleteMany({ bookId: id });

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting book',
        error: error.message
      });
    }
  },

  // Get book categories
  getCategories: async (req, res) => {
    try {
      const categories = await Book.distinct('category', { status: 'published' });
      
      res.json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  },

  // Get book stats for admin
  getBookStats: async (req, res) => {
    try {
      const [total, published, drafts, archived, paid, free, totalViews, totalLikes, totalPurchases] = await Promise.all([
        Book.countDocuments(),
        Book.countDocuments({ status: 'published' }),
        Book.countDocuments({ status: 'draft' }),
        Book.countDocuments({ status: 'archived' }),
        Book.countDocuments({ isPaid: true }),
        Book.countDocuments({ isPaid: false }),
        Book.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]),
        Book.aggregate([
          { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
        ]),
        BookPurchase.countDocuments({ paymentStatus: 'completed' })
      ]);

      res.json({
        success: true,
        stats: {
          total,
          published,
          drafts,
          archived,
          paid,
          free,
          totalViews: totalViews[0]?.totalViews || 0,
          totalLikes: totalLikes[0]?.totalLikes || 0,
          totalPurchases
        }
      });
    } catch (error) {
      console.error('Error fetching book stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching book statistics',
        error: error.message
      });
    }
  },

  // Like a book
  likeBook: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const book = await Book.findById(id);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Check if user already liked this book
      if (book.likedBy.includes(userId)) {
        return res.json({
          success: true,
          likes: book.likes,
          message: 'Book already liked by user'
        });
      }

      // Add user to likedBy array and increment likes count
      book.likedBy.push(userId);
      book.likes = book.likedBy.length;
      await book.save();

      res.json({
        success: true,
        likes: book.likes,
        message: 'Book liked successfully'
      });
    } catch (error) {
      console.error('Error liking book:', error);
      res.status(500).json({
        success: false,
        message: 'Error liking book',
        error: error.message
      });
    }
  },

  // Unlike a book
  unlikeBook: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const book = await Book.findById(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Check if user hasn't liked this book
      if (!book.likedBy.includes(userId)) {
        return res.json({
          success: true,
          likes: book.likes,
          message: 'Book not liked by user'
        });
      }

      // Remove user from likedBy array and update likes count
      book.likedBy = book.likedBy.filter(user => user !== userId);
      book.likes = book.likedBy.length;
      await book.save();

      res.json({
        success: true,
        likes: book.likes,
        message: 'Book unliked successfully'
      });
    } catch (error) {
      console.error('Error unliking book:', error);
      res.status(500).json({
        success: false,
        message: 'Error unliking book',
        error: error.message
      });
    }
  },

  // Purchase a book (free books only - paid books go through Razorpay)
  purchaseBook: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        userId,
        userName,
        userEmail,
        phoneNumber,
        address
      } = req.body;

      if (!userId || !userName || !userEmail) {
        return res.status(400).json({
          success: false,
          message: 'User information is required'
        });
      }

      const book = await Book.findById(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // IMPORTANT: Paid books must go through Razorpay payment flow
      if (book.price > 0) {
        return res.status(400).json({
          success: false,
          message: 'This is a paid book. Please complete payment through Razorpay.',
          requiresPayment: true,
          bookPrice: book.price,
          currency: book.currency || 'INR'
        });
      }

      // Check if user already purchased this book
      const existingPurchase = await BookPurchase.findOne({ bookId: id, userId });
      if (existingPurchase) {
        return res.json({
          success: true,
          message: 'Book already purchased',
          purchase: existingPurchase
        });
      }

      // Create purchase record
      const purchase = new BookPurchase({
        bookId: id,
        userId,
        userName,
        userEmail,
        price: book.price,
        currency: book.currency,
        paymentStatus: 'completed'
      });

      await purchase.save();

      // Prepare solution link data for free books
      const isFreeBook = book.price === 0;
      let solutionLinkData = {
        driveUrl: '',
        isEnabled: false,
        accessToken: null
      };

      // For free books, auto-enable the drive link (even if shareableLink is empty)
      if (isFreeBook) {
        const crypto = await import('crypto');
        const accessToken = crypto.randomBytes(32).toString('hex');
        
        solutionLinkData = {
          driveUrl: book.shareableLink || '', // Use shareableLink if available, empty string if not
          isEnabled: true,
          enabledAt: new Date(),
          enabledBy: 'Auto-enabled for free book',
          accessToken: accessToken
        };
      }

      // Create order record
      const order = new Order({
        itemType: 'book',
        customerInfo: {
          fullName: userName,
          email: userEmail,
          phoneNumber: phoneNumber || '',
          address: address || ''
        },
        productInfo: {
          title: book.title, // Required field - use book title for productInfo.title
          summary: book.excerpt || '',
          imageUrl: book.coverImage || '',
          drivePath: ''
        },
        bookInfo: {
          bookId: book._id,
          title: book.title,
          slug: book.slug,
          author: book.author || 'Admin',
          category: book.category || 'Book',
          coverImage: book.coverImage || ''
        },
        totalAmount: book.price || 0,
        currency: book.currency || 'USD',
        isFree: isFreeBook,
        status: 'delivered',
        paymentStatus: 'completed',
        solutionLink: solutionLinkData
      });

      await order.save();

      // Increment purchase count
      book.purchases += 1;
      await book.save();

      res.status(201).json({
        success: true,
        message: 'Book purchased successfully',
        purchase,
        order
      });
    } catch (error) {
      console.error('Error purchasing book:', error);
      res.status(500).json({
        success: false,
        message: 'Error purchasing book',
        error: error.message
      });
    }
  },

  // Get user's purchased books
  getUserPurchases: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const purchases = await BookPurchase.getUserPurchases(userId);
      
      res.json({
        success: true,
        purchases
      });
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user purchases',
        error: error.message
      });
    }
  },

  // Fetch book settings from Google Sheets
  fetchBookSettings: async (req, res) => {
    try {
      const { spreadsheetId, sheetName } = req.query;
      
      if (!spreadsheetId) {
        return res.status(400).json({
          success: false,
          message: 'Spreadsheet ID is required'
        });
      }

      console.log('Fetching book settings from Google Sheets...');
      console.log('Spreadsheet ID:', spreadsheetId);
      console.log('Sheet Name:', sheetName);
      
      const bookSettings = await fetchBookSettingsFromSheet(spreadsheetId, sheetName);
      
      console.log('=== BOOK SETTINGS DATA ===');
      console.log('Raw book settings object:', JSON.stringify(bookSettings, null, 2));
      
      // Log individual settings in a formatted way
      console.log('\n=== FORMATTED BOOK SETTINGS ===');
      Object.entries(bookSettings).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      
      console.log('=== END BOOK SETTINGS ===');
      
      res.json({
        success: true,
        message: 'Book settings fetched successfully (check console for detailed output)',
        data: bookSettings,
        totalFields: Object.keys(bookSettings).length
      });
    } catch (error) {
      console.error('Error fetching book settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching book settings from Google Sheets',
        error: error.message
      });
    }
  }
};

export default bookController;