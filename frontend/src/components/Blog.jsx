import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { apiFetch, getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

const Blog = () => {
  const navigate = useNavigate();
  const { settings, getSettingValue } = useSettings();
  const [blogsData, setBlogsData] = useState({
    heading: 'Latest Blog Posts',
    subheading: 'Discover insights, tips, and tutorials to enhance your knowledge.',
    blogs: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [likedBlogs, setLikedBlogs] = useState(new Set());
  const [userId, setUserId] = useState(null);

  // Load Google Sheets data for section header
  const loadGoogleSheetsData = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    
    const heading = getSettingValue('Blog Main Heading', 'Latest Blog Posts');
    const subheading = getSettingValue('Blog Subheading', 'Discover insights, tips, and tutorials to enhance your knowledge.');
    
    setBlogsData(prev => ({
      ...prev,
      heading,
      subheading
    }));
  };

  // Load Google Sheets data when settings change
  useEffect(() => {
    loadGoogleSheetsData();
  }, [settings]);

  // Get or create user session ID
  const getUserId = () => {
    let storedUserId = localStorage.getItem('blogUserId');
    if (!storedUserId) {
      // Generate a unique user ID for this browser session
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('blogUserId', storedUserId);
    }
    return storedUserId;
  };

  // Initialize user ID
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  // Fetch blogs from API
  const fetchBlogs = async (page = 1, search = '', showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9'
      });
      
      if (search) params.append('search', search);
      if (userId) params.append('userId', userId);
      
      const response = await apiFetch(`${API_URL}/blog?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBlogsData(prev => ({
          ...prev,
          blogs: data.blogs
        }));
        setPagination(data.pagination);
        
        // Update liked blogs state based on server response
        const likedBlogIds = new Set();
        data.blogs.forEach(blog => {
          if (blog.isLiked) {
            likedBlogIds.add(blog._id);
          }
        });
        setLikedBlogs(likedBlogIds);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Categories functionality removed - using real-time search instead

  useEffect(() => {
    if (userId) {
      fetchBlogs(currentPage, '', true);
    }
  }, [currentPage, userId]);

  // Categories useEffect removed - using real-time search instead

  // Real-time search - no longer needed as search is handled in onChange

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Navigate to blog detail
  const handleBlogClick = (slug) => {
    navigate(`/blog/${slug}`);
  };

  // Handle image load error
  const handleImageError = (blogId) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [blogId]: true
    }));
  };

  // Handle image load success
  const handleImageLoad = (blogId) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [blogId]: false
    }));
  };

  // Handle blog like/unlike
  const handleLike = async (e, blogId) => {
    e.stopPropagation(); // Prevent card click when heart is clicked
    
    if (!userId) {
      console.error('User ID not available');
      return;
    }
    
    try {
      const isCurrentlyLiked = likedBlogs.has(blogId);
      const endpoint = isCurrentlyLiked ? 'unlike' : 'like';
      
      const response = await apiFetch(`${API_URL}/blog/${blogId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local liked state
        setLikedBlogs(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.delete(blogId);
          } else {
            newSet.add(blogId);
          }
          return newSet;
        });
        
        // Update the blog's like count in the blogs array
        setBlogsData(prev => ({
          ...prev,
          blogs: prev.blogs.map(blog => 
            blog._id === blogId 
              ? { ...blog, likes: data.likes }
              : blog
          )
        }));
      }
    } catch (error) {
      console.error('Error updating blog like:', error);
    }
  };

  return (
    <section className="py-16 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="text-center lg:text-left lg:flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {blogsData.heading}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {blogsData.subheading}
              </p>
            </div>
            
            {/* Search Input - Top Right */}
            <div className="mt-6 lg:mt-0 lg:ml-8 lg:w-80 flex lg:justify-end">
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Real-time search with debounce - no loading spinner
                  clearTimeout(window.searchTimeout);
                  window.searchTimeout = setTimeout(() => {
                    setCurrentPage(1);
                    fetchBlogs(1, e.target.value, false);
                  }, 500);
                }}
                className="w-full lg:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {blogsData.blogs.length > 0 ? (
                blogsData.blogs.map((blog) => (
                  <div
                    key={blog._id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:scale-105 cursor-pointer relative"
                    onClick={() => handleBlogClick(blog.slug)}
                  >
                    {/* Heart Icon - Top Right */}
                    <button
                      onClick={(e) => handleLike(e, blog._id)}
                      className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-lg cursor-pointer"
                    >
                      <svg 
                        className={`w-5 h-5 transition-colors duration-300 ${
                          likedBlogs.has(blog._id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'fill-none text-gray-600 hover:text-red-500'
                        }`}
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        likedBlogs.has(blog._id) 
                          ? 'text-red-500' 
                          : 'text-gray-600'
                      }`}>
                        {blog.likes || 0}
                      </span>
                    </button>
                    {/* Featured Image */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {blog.featuredImage ? (
                        <>
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onLoad={() => handleImageLoad(blog._id)}
                            onError={(e) => {
                              console.error('Failed to load image:', blog.featuredImage, e);
                              handleImageError(blog._id);
                            }}
                            style={{ display: imageLoadErrors[blog._id] ? 'none' : 'block' }}
                          />
                          {imageLoadErrors[blog._id] && (
                            <div className="flex flex-col items-center justify-center text-gray-400 p-8 absolute inset-0">
                              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm font-medium">BLOG POST</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                          <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium">BLOG POST</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      {/* Category and Date */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block bg-blue-100 text-brand-primary text-xs font-semibold px-2 py-1 rounded-full">
                          {blog.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(blog.createdAt)}
                        </span>
                      </div>
                      
                      {/* Title and Excerpt */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {blog.title}
                        </h3>
                        {blog.excerpt && (
                          <p className="text-sm text-gray-600" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {blog.excerpt}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {blog.views}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {blog.likes}
                          </span>
                        </div>
                        <span className="text-brand-primary font-medium">Read More →</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 text-lg">No blogs found.</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-brand-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Blog; 