import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import { 
  fetchBlogsFromDrive, 
  syncBlogsFromDrive, 
  getBlogBySlug, 
  getLatestBlogs, 
  searchBlogs 
} from '../services/blogService.js';

const blogController = {
  // Get all blogs (with pagination)
  getAllBlogs: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const category = req.query.category;

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

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('title slug excerpt featuredImage createdAt views likes category tags author likedBy'),
        Blog.countDocuments(query)
      ]);

      // If userId is provided in query, include liked status for each blog
      const userId = req.query.userId;
      if (userId) {
        blogs.forEach(blog => {
          blog._doc.isLiked = blog.likedBy.includes(userId);
        });
      }

      res.json({
        success: true,
        blogs,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blogs',
        error: error.message
      });
    }
  },

  // Get single blog by slug
  getBlogBySlug: async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.query.userId;
      
      const blog = await getBlogBySlug(slug);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // If userId is provided, include liked status
      if (userId && blog.likedBy) {
        blog._doc.isLiked = blog.likedBy.includes(userId);
      }

      // Get related blogs (same category, excluding current blog)
      const relatedBlogs = await getLatestBlogs(3, slug);

      res.json({
        success: true,
        blog,
        relatedBlogs
      });
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blog',
        error: error.message
      });
    }
  },

  // Get latest blogs
  getLatestBlogs: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const blogs = await getLatestBlogs(limit);

      res.json({
        success: true,
        blogs
      });
    } catch (error) {
      console.error('Error fetching latest blogs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching latest blogs',
        error: error.message
      });
    }
  },

  // Search blogs
  searchBlogs: async (req, res) => {
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

      const results = await searchBlogs(q, page, limit);

      res.json({
        success: true,
        ...results
      });
    } catch (error) {
      console.error('Error searching blogs:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching blogs',
        error: error.message
      });
    }
  },

  // Sync blogs from Google Drive
  syncFromDrive: async (req, res) => {
    try {
      console.log('Starting blog sync from Google Drive...');
      
      const result = await syncBlogsFromDrive();
      
      res.json({
        success: true,
        message: 'Blogs synced successfully from Google Drive',
        ...result
      });
    } catch (error) {
      console.error('Error syncing blogs from Google Drive:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing blogs from Google Drive',
        error: error.message
      });
    }
  },

  // Get blogs for admin panel
  getAdminBlogs: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status || 'all';

      let query = {};
      if (status !== 'all') {
        query.status = status;
      }

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Blog.countDocuments(query)
      ]);

      // Add comment counts for each blog
      const blogsWithComments = await Promise.all(
        blogs.map(async (blog) => {
          const commentCount = await Comment.countDocuments({ 
            blogId: blog._id,
            status: 'approved'
          });
          return {
            ...blog.toObject(),
            commentCount
          };
        })
      );

      res.json({
        success: true,
        blogs: blogsWithComments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page
        }
      });
    } catch (error) {
      console.error('Error fetching admin blogs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blogs for admin',
        error: error.message
      });
    }
  },

  // Create new blog
  createBlog: async (req, res) => {
    try {
      const blogData = req.body;
      
      // Generate slug from title if not provided
      if (!blogData.slug) {
        blogData.slug = blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }

      const blog = new Blog(blogData);
      await blog.save();

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        blog
      });
    } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating blog',
        error: error.message
      });
    }
  },

  // Update blog
  updateBlog: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const blog = await Blog.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        message: 'Blog updated successfully',
        blog
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating blog',
        error: error.message
      });
    }
  },

  // Delete blog
  deleteBlog: async (req, res) => {
    try {
      const { id } = req.params;

      const blog = await Blog.findByIdAndDelete(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting blog',
        error: error.message
      });
    }
  },

  // Get blog categories
  getCategories: async (req, res) => {
    try {
      const categories = await Blog.distinct('category', { status: 'published' });
      
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

  // Get blog stats for admin
  getBlogStats: async (req, res) => {
    try {
      const [total, published, drafts, archived, totalViews, totalLikes, totalComments] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ status: 'published' }),
        Blog.countDocuments({ status: 'draft' }),
        Blog.countDocuments({ status: 'archived' }),
        Blog.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]),
        Blog.aggregate([
          { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
        ]),
        Comment.countDocuments({ status: 'approved' })
      ]);

      res.json({
        success: true,
        stats: {
          total,
          published,
          drafts,
          archived,
          totalViews: totalViews[0]?.totalViews || 0,
          totalLikes: totalLikes[0]?.totalLikes || 0,
          totalComments
        }
      });
    } catch (error) {
      console.error('Error fetching blog stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blog statistics',
        error: error.message
      });
    }
  },

  // Regenerate excerpts for all blogs
  regenerateExcerpts: async (req, res) => {
    try {
      const blogs = await Blog.find({});
      let updated = 0;

      for (const blog of blogs) {
        // Clear the excerpt so it gets regenerated on save
        blog.excerpt = '';
        await blog.save();
        updated++;
      }

      res.json({
        success: true,
        message: `Successfully regenerated excerpts for ${updated} blogs`,
        updated
      });
    } catch (error) {
      console.error('Error regenerating excerpts:', error);
      res.status(500).json({
        success: false,
        message: 'Error regenerating excerpts',
        error: error.message
      });
    }
  },

  // Like a blog
  likeBlog: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const blog = await Blog.findById(id);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Check if user already liked this blog
      if (blog.likedBy.includes(userId)) {
        return res.json({
          success: true,
          likes: blog.likes,
          message: 'Blog already liked by user'
        });
      }

      // Add user to likedBy array and increment likes count
      blog.likedBy.push(userId);
      blog.likes = blog.likedBy.length;
      await blog.save();

      res.json({
        success: true,
        likes: blog.likes,
        message: 'Blog liked successfully'
      });
    } catch (error) {
      console.error('Error liking blog:', error);
      res.status(500).json({
        success: false,
        message: 'Error liking blog',
        error: error.message
      });
    }
  },

  // Unlike a blog
  unlikeBlog: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Check if user hasn't liked this blog
      if (!blog.likedBy.includes(userId)) {
        return res.json({
          success: true,
          likes: blog.likes,
          message: 'Blog not liked by user'
        });
      }

      // Remove user from likedBy array and update likes count
      blog.likedBy = blog.likedBy.filter(user => user !== userId);
      blog.likes = blog.likedBy.length;
      await blog.save();

      res.json({
        success: true,
        likes: blog.likes,
        message: 'Blog unliked successfully'
      });
    } catch (error) {
      console.error('Error unliking blog:', error);
      res.status(500).json({
        success: false,
        message: 'Error unliking blog',
        error: error.message
      });
    }
  },
};

export default blogController;