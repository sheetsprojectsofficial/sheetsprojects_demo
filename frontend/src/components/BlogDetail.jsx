import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Comments from './Comments';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);

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

  // Initialize user ID and fetch blog detail
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchBlogDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get or create user ID
        const id = getUserId();
        if (isMounted) {
          setUserId(id);
        }
        
        const params = new URLSearchParams();
        if (id) params.append('userId', id);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/blog/${slug}?${params}`, {
          signal: abortController.signal
        });
        const data = await response.json();
        
        if (isMounted && data.success) {
          setBlog(data.blog);
          setRelatedBlogs(data.relatedBlogs || []);
          
          // Check if current user has liked this blog
          if (id && data.blog.likedBy && data.blog.likedBy.includes(id)) {
            setIsLiked(true);
          }
        } else if (isMounted && !data.success) {
          setError('Blog not found');
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Error fetching blog detail:', error);
          setError('Failed to load blog');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchBlogDetail();
    }
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [slug]); // Only depend on slug, not userId

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRelatedBlogClick = (relatedSlug) => {
    navigate(`/blog/${relatedSlug}`);
  };

  // Function to remove images from HTML content
  const stripImagesFromContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    let cleanedContent = htmlContent;
    
    // Remove all img tags from the content
    cleanedContent = cleanedContent.replace(/<img[^>]*>/gi, '');
    
    // Remove empty paragraphs that might be left after removing images
    cleanedContent = cleanedContent.replace(/<p[^>]*>\s*<\/p>/gi, '');
    
    // Remove empty divs that might be left after removing images
    cleanedContent = cleanedContent.replace(/<div[^>]*>\s*<\/div>/gi, '');
    
    // Remove empty spans that might be left after removing images
    cleanedContent = cleanedContent.replace(/<span[^>]*>\s*<\/span>/gi, '');
    
    // Remove multiple consecutive line breaks and normalize spacing
    cleanedContent = cleanedContent.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
    
    // Remove excessive whitespace between HTML elements
    cleanedContent = cleanedContent.replace(/>\s{2,}</g, '><');
    
    // Clean up any remaining empty elements with only whitespace
    cleanedContent = cleanedContent.replace(/<([^>]+)>\s*<\/\1>/gi, '');
    
    return cleanedContent.trim();
  };

  // Handle blog like/unlike
  const handleLike = async () => {
    if (!userId) {
      console.error('User ID not available');
      return;
    }
    
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/blog/${blog._id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(!isLiked);
        setBlog(prev => ({ ...prev, likes: data.likes }));
      }
    } catch (error) {
      console.error('Error updating blog like:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/blog')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Featured Image */}
                {blog.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-8">
                  <button
                    onClick={() => navigate('/blog')}
                    className="inline-flex items-center text-brand-primary hover:text-brand-primary mb-6 transition-colors duration-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Blogs
                  </button>

                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block bg-blue-100 text-brand-primary text-sm font-semibold px-3 py-1 rounded-full">
                      {blog.category}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(blog.createdAt)}
                      </span>
                      {/* Heart Icon */}
                      <button
                        onClick={handleLike}
                        className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-300 cursor-pointer"
                      >
                        <svg 
                          className={`w-6 h-6 transition-colors duration-300 ${
                            isLiked 
                              ? 'fill-red-500 text-red-500' 
                              : 'fill-none text-gray-600 hover:text-red-500'
                          }`}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isLiked 
                            ? 'text-red-500' 
                            : 'text-gray-600'
                        }`}>
                          {blog.likes || 0}
                        </span>
                      </button>
                    </div>
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {blog.title}
                  </h1>

                  <div className="flex items-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
                    <span className="flex items-center mr-6">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {blog.author}
                    </span>
                    <span className="flex items-center mr-6">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {blog.views} views
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {blog.likes} likes
                    </span>
                  </div>

                  <div 
                    className="prose prose-lg max-w-none"
                    style={{
                      lineHeight: '1.8',
                      color: '#374151'
                    }}
                    dangerouslySetInnerHTML={{ __html: stripImagesFromContent(blog.content) }}
                  />

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors duration-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <Comments blogId={blog._id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Share this post</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      const text = `Check out this blog post: ${blog.title}`;
                      if (navigator.share) {
                        navigator.share({ title: blog.title, text, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-300 text-sm font-medium"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Check out this blog post: ${blog.title}`);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                    }}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-brand-primary py-2 px-4 rounded-lg transition-colors duration-300 text-sm font-medium"
                  >
                    Tweet
                  </button>
                </div>
              </div>
              {relatedBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Posts</h3>
                  <div className="space-y-2">
                    {relatedBlogs.map((relatedBlog, index) => (
                      <div
                        key={relatedBlog._id}
                        className="cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        onClick={() => handleRelatedBlogClick(relatedBlog.slug)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{backgroundColor: 'var(--brand-primary)'}}>
                            {index + 1}
                          </span>
                          <h4 className="flex-1 text-sm font-medium text-blue-600 group-hover:text-brand-primary transition-colors duration-200 leading-relaxed line-clamp-2 hover:underline">
                            {relatedBlog.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;