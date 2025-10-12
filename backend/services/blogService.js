import { google } from 'googleapis';
import mammoth from 'mammoth';
import Blog from '../models/Blog.js';

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

const extractImagesFromHtml = (html) => {
  const images = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  let match;
  let position = 0;

  while ((match = imgRegex.exec(html)) !== null) {
    let imageUrl = match[1];
    
    // Convert Google User Content URLs to direct image URLs for better loading
    if (imageUrl.includes('googleusercontent.com') && imageUrl.includes('docsz/')) {
      // Keep the URL as is, but ensure it's properly formatted
      imageUrl = imageUrl.replace(/&amp;/g, '&');
    }
    
    images.push({
      url: imageUrl,
      caption: '',
      position: position++
    });
  }

  return images;
};

export const fetchBlogsFromDrive = async () => {
  try {
    console.log('Fetching blogs from Google Drive...');
    
    const drive = authenticateGoogleDrive();
    const blogsFolderId = process.env.BLOGS_FOLDER_ID;
    
    if (!blogsFolderId) {
      throw new Error('BLOGS_FOLDER_ID is not set in environment variables');
    }

    // List all DOCX files and Google Docs files in the blogs folder
    const response = await drive.files.list({
      q: `'${blogsFolderId}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/vnd.google-apps.document') and trashed=false`,
      fields: 'files(id, name, modifiedTime, size, mimeType)',
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files;
    console.log(`Found ${files.length} document files in blogs folder (DOCX and Google Docs)`);

    const blogs = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.mimeType})`);
        
        let html = '';
        
        if (file.mimeType === 'application/vnd.google-apps.document') {
          // For Google Docs, export as HTML directly
          const fileResponse = await drive.files.export({
            fileId: file.id,
            mimeType: 'text/html'
          });
          html = fileResponse.data;
        } else {
          // For DOCX files, download and convert using mammoth
          const fileResponse = await drive.files.get({
            fileId: file.id,
            alt: 'media'
          }, {
            responseType: 'arraybuffer'
          });

          const result = await mammoth.convertToHtml({
            buffer: Buffer.from(fileResponse.data)
          });
          html = result.value;
        }

        const images = extractImagesFromHtml(html);
        
        // Extract title from filename (remove .docx extension if present)
        const title = file.name.replace(/\.docx$/i, '');
        const slug = generateSlug(title);

        // Get first image as featured image if available
        const featuredImage = images.length > 0 ? images[0].url : '';

        // Create blog object
        const blogData = {
          title,
          slug,
          content: html,
          featuredImage,
          images,
          driveFileId: file.id,
          driveFileName: file.name,
          author: 'Admin',
          category: 'Blog',
          status: 'published'
        };

        blogs.push(blogData);
        console.log(`Successfully processed: ${title}`);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
      }
    }

    console.log(`Successfully processed ${blogs.length} blogs from Drive`);
    return blogs;

  } catch (error) {
    console.error('Error fetching blogs from Google Drive:', error);
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};

export const syncBlogsFromDrive = async () => {
  try {
    const driveBlogs = await fetchBlogsFromDrive();
    const syncResults = await Blog.syncFromDrive(driveBlogs);
    
    console.log('Blog sync completed:', syncResults);
    return {
      success: true,
      blogs: driveBlogs,
      syncResults
    };
  } catch (error) {
    console.error('Error syncing blogs:', error);
    throw error;
  }
};

export const getBlogBySlug = async (slug) => {
  try {
    const blog = await Blog.findOne({ slug, status: 'published' }).select('+likedBy');
    if (blog) {
      // Increment views
      blog.views += 1;
      await blog.save();
    }
    return blog;
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    throw error;
  }
};

export const getLatestBlogs = async (limit = 5, excludeSlug = null) => {
  try {
    const query = { status: 'published' };
    if (excludeSlug) {
      query.slug = { $ne: excludeSlug };
    }
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title slug excerpt featuredImage createdAt views likes');
    
    return blogs;
  } catch (error) {
    console.error('Error fetching latest blogs:', error);
    throw error;
  }
};

export const searchBlogs = async (searchTerm, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const query = {
      status: 'published',
      $or: [
        { title: { $regex: searchRegex } },
        { excerpt: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        { category: { $regex: searchRegex } }
      ]
    };
    
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug excerpt featuredImage createdAt views likes category tags'),
      Blog.countDocuments(query)
    ]);
    
    return {
      blogs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error searching blogs:', error);
    throw error;
  }
};