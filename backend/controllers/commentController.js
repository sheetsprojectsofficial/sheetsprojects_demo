import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';
import Book from '../models/Book.js';

const commentController = {
  // Get all comments for a specific blog or book
  getCommentsByBlog: async (req, res) => {
    try {
      const { blogId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Try to find the item as a blog first, then as a book
      let item = await Blog.findById(blogId);
      let itemType = 'blog';
      
      if (!item) {
        item = await Book.findById(blogId);
        itemType = 'book';
      }
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Get top-level comments (no parent)
      const [comments, total] = await Promise.all([
        Comment.find({ 
          itemId: blogId,
          itemType, 
          parentComment: null,
          status: 'approved'
        })
          .populate('replies')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Comment.countDocuments({ 
          itemId: blogId,
          itemType,
          parentComment: null,
          status: 'approved'
        })
      ]);

      res.json({
        success: true,
        comments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  },

  // Create a new comment
  createComment: async (req, res) => {
    try {
      const { blogId } = req.params;
      const { userId, userName, userEmail, content, parentComment } = req.body;

      // Validate required fields
      if (!userId || !userName || !userEmail || !content) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Try to find the item as a blog first, then as a book
      let item = await Blog.findById(blogId);
      let itemType = 'blog';
      
      if (!item) {
        item = await Book.findById(blogId);
        itemType = 'book';
      }
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // If it's a reply, verify parent comment exists
      if (parentComment) {
        const parent = await Comment.findById(parentComment);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found'
          });
        }
      }

      // Create comment
      const comment = new Comment({
        itemId: blogId,
        itemType,
        userId,
        userName,
        userEmail,
        content,
        parentComment: parentComment || null
      });

      await comment.save();

      // If it's a reply, add to parent's replies array
      if (parentComment) {
        await Comment.findByIdAndUpdate(
          parentComment,
          { $push: { replies: comment._id } }
        );
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating comment',
        error: error.message
      });
    }
  },

  // Update comment (for admin moderation)
  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, content } = req.body;

      const comment = await Comment.findByIdAndUpdate(
        id,
        { ...(status && { status }), ...(content && { content }) },
        { new: true, runValidators: true }
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: 'Comment updated successfully',
        comment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  },

  // Delete comment (admin only)
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;

      const comment = await Comment.findByIdAndDelete(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Remove from parent's replies if it was a reply
      if (comment.parentComment) {
        await Comment.findByIdAndUpdate(
          comment.parentComment,
          { $pull: { replies: comment._id } }
        );
      }

      // Delete all replies to this comment
      await Comment.deleteMany({ parentComment: comment._id });

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting comment',
        error: error.message
      });
    }
  },

  // Get all comments for admin (across all blogs)
  getAdminComments: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status || 'all';

      let query = {};
      if (status !== 'all') {
        query.status = status;
      }

      const [comments, total] = await Promise.all([
        Comment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Comment.countDocuments(query)
      ]);

      res.json({
        success: true,
        comments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching admin comments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  },

  // Get comment statistics for admin dashboard
  getCommentStats: async (req, res) => {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        Comment.countDocuments(),
        Comment.countDocuments({ status: 'pending' }),
        Comment.countDocuments({ status: 'approved' }),
        Comment.countDocuments({ status: 'rejected' })
      ]);

      res.json({
        success: true,
        stats: {
          total,
          pending,
          approved,
          rejected
        }
      });
    } catch (error) {
      console.error('Error fetching comment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comment statistics',
        error: error.message
      });
    }
  },

  // Get comments count for specific blog or book (for admin dashboard)
  getCommentsCountByBlog: async (req, res) => {
    try {
      const { blogId } = req.params;

      // Try to find the item as a blog first, then as a book
      let item = await Blog.findById(blogId);
      let itemType = 'blog';
      
      if (!item) {
        item = await Book.findById(blogId);
        itemType = 'book';
      }
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      const count = await Comment.countDocuments({ 
        itemId: blogId,
        itemType, 
        status: 'approved' 
      });

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error fetching comments count:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments count',
        error: error.message
      });
    }
  }
};

export default commentController;