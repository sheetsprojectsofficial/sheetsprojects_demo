import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const SolutionViewer = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isFolder, setIsFolder] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (user && orderId) {
      getSolutionAccess();
    }
  }, [user, orderId]);

  const getSolutionAccess = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await apiFetch(`/orders/${orderId}/solution/access`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        loadSolutionContent(data.access.accessToken, token);
      } else {
        setError(data.message || 'Access denied');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error getting solution access:', err);
      setError('Failed to access solution');
      setLoading(false);
    }
  };

  const loadSolutionContent = async (accessToken, userToken) => {
    try {
      const response = await apiFetch(`/orders/solution/${accessToken}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const driveInfo = extractDriveId(data.solution.driveUrl);
        if (driveInfo) {
          setSolution(data.solution);
          await fetchDriveContent(driveInfo, userToken);
        } else {
          setError('Invalid Google Drive URL format');
        }
      } else {
        setError(data.message || 'Failed to load solution');
      }
    } catch (err) {
      console.error('Error loading solution:', err);
      setError('Failed to load solution content');
    } finally {
      setLoading(false);
    }
  };

  const extractDriveId = (driveUrl) => {
    if (!driveUrl || !driveUrl.includes('drive.google.com')) return null;
    
    // Extract file ID from different Google Drive URL formats
    let id = null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const viewMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (viewMatch) {
      id = viewMatch[1];
      return { id, type: 'file' };
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (openMatch) {
      id = openMatch[1];
      return { id, type: 'file' };
    }

    // Format: https://drive.google.com/drive/folders/FOLDER_ID
    const folderMatch = driveUrl.match(/\/drive\/folders\/([a-zA-Z0-9-_]+)/);
    if (folderMatch) {
      id = folderMatch[1];
      return { id, type: 'folder' };
    }

    return null;
  };

  const convertToEmbedUrl = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const fetchDriveContent = async (driveInfo, userToken) => {
    try {
      if (driveInfo.type === 'folder') {
        // Fetch folder contents using Google Drive API
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${driveInfo.id}'+in+parents&fields=files(id,name,mimeType,thumbnailLink,size)&key=${import.meta.env.VITE_GOOGLE_DRIVE_API_KEY}`,
          {
            headers: {
              'Authorization': `Bearer ${userToken}`,
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setDriveFiles(data.files || []);
          setIsFolder(true);
        } else {
          // Fallback: try to embed folder as iframe (limited functionality)
          const embedUrl = `https://drive.google.com/embeddedfolderview?id=${driveInfo.id}#grid`;
          setSolution(prev => ({ ...prev, embedUrl }));
          setIsFolder(true);
        }
      } else {
        // Single file
        const embedUrl = convertToEmbedUrl(driveInfo.id);
        setSolution(prev => ({ ...prev, embedUrl }));
        setIsFolder(false);
      }
    } catch (err) {
      console.error('Error fetching Drive content:', err);
      setError('Failed to load Drive content');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e) => {
    // Disable common keyboard shortcuts for saving/downloading
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      return false;
    }
  };

  useEffect(() => {
    // Disable right-click globally when component mounts
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📺';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📋';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading solution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-4">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.348 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBackToDashboard}
              className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToDashboard}
              className="flex cursor-pointer items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{solution?.productTitle}</h1>
            <p className="text-gray-500">Your purchased solution is ready to view</p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-brand-primary mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Secure Solution Access</h3>
                <p className="text-sm text-brand-primary mt-1">
                  This solution is securely shared with you and cannot be downloaded or shared with others.
                  Access is limited to your account only.
                </p>
              </div>
            </div>
          </div>

          {/* Solution Content */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {isFolder && driveFiles.length > 0 ? (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-brand-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v10z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Solution Files</h3>
                  <span className="ml-3 bg-blue-100 text-brand-primary text-sm px-2 py-1 rounded-full">{driveFiles.length} files</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      onContextMenu={handleContextMenu}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{getFileIcon(file.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{file.name}</h4>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Click to view</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative" style={{ paddingBottom: '75%', height: 0 }}>
                <iframe
                  src={solution?.embedUrl}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  title={`Solution for ${solution?.productTitle}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onError={() => setError('Failed to load solution content')}
                  allow="fullscreen"
                  onContextMenu={handleContextMenu}
                />
              </div>
            )}

            {/* Solution Info Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Order ID: <span className="font-mono font-medium ml-1">{solution?.orderId}</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Secure Access Active
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Need Support?</h3>
                <p className="text-gray-600 mb-4">
                  Having trouble viewing the solution or need technical assistance? Our support team is here to help.
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* File Preview Modal */}
          {showModal && selectedFile && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div ref={modalRef} className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getFileIcon(selectedFile.mimeType)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2"
                  >
                    ×
                  </button>
                </div>
                
                <div className="relative" style={{ height: 'calc(90vh - 120px)' }}>
                  <iframe
                    src={convertToEmbedUrl(selectedFile.id)}
                    className="w-full h-full border-0"
                    title={selectedFile.name}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onContextMenu={handleContextMenu}
                    style={{
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitUserDrag: 'none',
                      KhtmlUserSelect: 'none'
                    }}
                  />
                  
                  {/* Overlay to prevent right-click and selections */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    onContextMenu={handleContextMenu}
                    style={{ zIndex: 1 }}
                  />
                </div>
                
                <div className="p-4 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure preview mode - Download and sharing disabled
                    </div>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionViewer;