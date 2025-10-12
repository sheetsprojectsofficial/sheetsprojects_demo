import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxLength: 500
  },
  featuredImage: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    caption: String,
    position: Number
  }],
  author: {
    type: String,
    default: 'Admin'
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String,
    trim: true
  }],
  driveFileId: {
    type: String
  },
  driveFileName: {
    type: String
  },
  lastSyncedFromDrive: {
    type: Date,
    default: Date.now
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Create indexes
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ status: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ driveFileId: 1 }, { unique: true, sparse: true });

// Generate excerpt from content if not provided
blogSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Remove HTML tags, CSS imports, and other non-content elements
    let textContent = this.content
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Remove CSS @import statements
      .replace(/@import[^;]*;/gi, '')
      // Remove CSS url() statements
      .replace(/url\([^)]*\)/gi, '')
      // Remove other CSS-like content
      .replace(/@[a-z-]+[^;]*;/gi, '')
      // Remove extra whitespace and normalize
      .replace(/\s+/g, ' ')
      .trim();
    
    // Only create excerpt if we have meaningful content
    if (textContent.length > 0) {
      this.excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
    }
  }
  
  // Generate SEO title and description if not provided
  if (!this.seo.title) {
    this.seo.title = this.title;
  }
  if (!this.seo.description) {
    this.seo.description = this.excerpt;
  }
  
  next();
});

// Static method to sync blogs from Drive
blogSchema.statics.syncFromDrive = async function(driveBlogs) {
  const syncResults = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  // Get all current drive file IDs from the driveBlogs array
  const driveFileIds = driveBlogs.map(blog => blog.driveFileId);

  try {
    // Step 1: Delete blogs that are no longer in Drive
    const blogsToDelete = await this.find({
      driveFileId: { $exists: true, $ne: null },
      driveFileId: { $nin: driveFileIds }
    });

    for (const blogToDelete of blogsToDelete) {
      await this.deleteOne({ _id: blogToDelete._id });
      syncResults.deleted++;
      console.log(`Deleted blog: ${blogToDelete.title} (no longer in Drive)`);
    }

    // Step 2: Create or update blogs from Drive
    for (const blogData of driveBlogs) {
      try {
        const existingBlog = await this.findOne({ driveFileId: blogData.driveFileId });
        
        if (existingBlog) {
          // Update existing blog
          Object.assign(existingBlog, {
            title: blogData.title,
            content: blogData.content,
            featuredImage: blogData.featuredImage,
            images: blogData.images,
            lastSyncedFromDrive: new Date()
          });
          await existingBlog.save();
          syncResults.updated++;
        } else {
          // Create new blog
          await this.create({
            ...blogData,
            lastSyncedFromDrive: new Date()
          });
          syncResults.created++;
        }
      } catch (error) {
        syncResults.errors.push({
          blogTitle: blogData.title,
          error: error.message
        });
      }
    }
  } catch (error) {
    syncResults.errors.push({
      blogTitle: 'Sync Process',
      error: error.message
    });
  }

  return syncResults;
};

export default mongoose.model('Blog', blogSchema);