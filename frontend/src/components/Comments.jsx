import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';

const Comments = React.memo(({ blogId, itemType = 'blog' }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState({
    content: ''
  });
  const [userInfo, setUserInfo] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [userId, setUserId] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const { isAdmin, getToken } = useAuth();

  // Get or create user session ID
  const getUserId = () => {
    let storedUserId = localStorage.getItem('blogUserId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('blogUserId', storedUserId);
    }
    return storedUserId;
  };

  // Initialize user ID and get user info from localStorage
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserInfo({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserInfo(null);
      }
    }
  }, []);

  // Fetch comments
  const fetchComments = async (signal) => {
    try {
      setLoading(true);
      const endpoint = itemType === 'book' ? 'book' : 'blog';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${endpoint}/${blogId}`, {
        signal: signal
      });
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e, parentCommentId = null) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('User session not available');
      return;
    }

    if (!userInfo) {
      toast.error('Please log in to comment');
      return;
    }

    if (!newComment.content.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setSubmitting(true);
      
      const commentData = {
        userId: userInfo.uid,
        userName: userInfo.displayName,
        userEmail: userInfo.email,
        content: newComment.content.trim()
      };

      if (parentCommentId) {
        commentData.parentComment = parentCommentId;
      }

      const endpoint = itemType === 'book' ? 'book' : 'blog';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${endpoint}/${blogId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comment posted successfully!');
        setNewComment({ content: '' });
        setReplyingTo(null);
        // Refresh comments without signal since this is user-initiated
        const controller = new AbortController();
        fetchComments(controller.signal);
      } else {
        toast.error(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user avatar initials
  const getAvatarInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (commentId) => {
    if (!isAdmin()) {
      toast.error('You do not have permission to delete comments');
      return;
    }
    
    setCommentToDelete(commentId);
    setConfirmModalOpen(true);
  };

  // Delete comment (admin only)
  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      setDeletingComment(commentToDelete);
      const token = await getToken();
      
      if (!token) {
        toast.error('Authentication token not available');
        setConfirmModalOpen(false);
        setCommentToDelete(null);
        setDeletingComment(null);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/admin/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comment deleted successfully');
        // Refresh comments without signal since this is user-initiated
        const controller = new AbortController();
        fetchComments(controller.signal);
      } else {
        toast.error(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setDeletingComment(null);
      setConfirmModalOpen(false);
      setCommentToDelete(null);
    }
  };

  // Close confirmation modal
  const handleCloseModal = () => {
    if (!deletingComment) {
      setConfirmModalOpen(false);
      setCommentToDelete(null);
    }
  };

  useEffect(() => {
    // Prevent unnecessary calls if we don't have a valid ID
    if (!blogId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    let isMounted = true;
    
    const loadComments = async () => {
      if (isMounted) {
        await fetchComments(abortController.signal);
      }
    };
    
    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      loadComments();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [blogId, itemType]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Comments</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {userInfo ? (
        <form onSubmit={handleSubmitComment} className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Leave a Comment</h4>
          
          {/* User info display */}
          {/* <div className="flex items-center mb-4 p-3 bg-white rounded-lg border">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-brand-primary font-medium text-sm">
                {getAvatarInitials(userInfo.displayName)}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{userInfo.displayName}</p>
              <p className="text-sm text-gray-500">{userInfo.email}</p>
            </div>
          </div> */}
          
          <textarea
            placeholder="Write your comment here..."
            value={newComment.content}
            onChange={(e) => setNewComment({ content: e.target.value })}
            rows={4}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent mb-3 sm:mb-4 text-sm sm:text-base"
            required
          />
          
          <button
            type="submit"
            disabled={submitting}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-300 text-sm sm:text-base font-medium"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Please log in to leave a comment</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-300 text-sm sm:text-base font-medium"
          >
            Log In
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 sm:space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-medium text-xs sm:text-sm">
                      {getAvatarInitials(comment.userName)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                    <h5 className="text-sm sm:text-base font-semibold text-gray-900">
                      {comment.userName}
                    </h5>
                    <span className="text-xs sm:text-xs text-gray-500 mt-1 sm:mt-0">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3 leading-relaxed text-sm sm:text-base">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="text-brand-primary text-sm hover:text-brand-primary font-medium cursor-pointer"
                    >
                      Reply
                    </button>
                    
                    {/* Admin Delete Button */}
                    {isAdmin() && (
                      <button
                        onClick={() => handleDeleteClick(comment._id)}
                        disabled={deletingComment === comment._id}
                        className="text-red-600 text-sm hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingComment === comment._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && userInfo && (
                    <form
                      onSubmit={(e) => handleSubmitComment(e, comment._id)}
                      className="mt-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {/* <div className="flex items-center mb-3 p-2 bg-white rounded border">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-brand-primary font-medium text-xs">
                            {getAvatarInitials(userInfo.displayName)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{userInfo.displayName}</span>
                      </div> */}
                      <textarea
                        placeholder="Write your reply..."
                        value={newComment.content}
                        onChange={(e) => setNewComment({ content: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent mb-3"
                        required
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Posting...' : 'Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {replyingTo === comment._id && !userInfo && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-600 mb-2">Please log in to reply</p>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-6 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-xs">
                                {getAvatarInitials(reply.userName)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h6 className="text-sm font-semibold text-gray-900">
                                {reply.userName}
                              </h6>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {reply.content}
                            </p>
                            
                            {/* Admin Delete Button for Reply */}
                            {isAdmin() && (
                              <div className="mt-2">
                                <button
                                  onClick={() => handleDeleteClick(reply._id)}
                                  disabled={deletingComment === reply._id}
                                  className="text-red-600 text-xs hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingComment === reply._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        loading={!!deletingComment}
      />
    </div>
  );
});

export default Comments;