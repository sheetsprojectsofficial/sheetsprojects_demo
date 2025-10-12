import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Footer from "./Footer";

const BookReader = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookContent, setBookContent] = useState({
    image: null,
    chapters: null,
    excerpt: null,
    settings: null,
  });
  const [contentLoading, setContentLoading] = useState(false);
  const [documentIds, setDocumentIds] = useState({
    chapters: null,
    excerpt: null,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (isAuthenticated && user) params.append("userId", user.uid);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/books/${slug}?${params}`
        );
        const data = await response.json();

        if (data.success) {
          setBook(data.book);

          // Check if user has access to this book
          if (!data.book.isPurchased) {
            toast.error("You need to purchase this book to read it");
            navigate(`/books/${slug}`);
            return;
          }
        } else {
          setError("Book not found");
        }
      } catch (error) {
        setError("Failed to load book");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBookDetail();
    }
  }, [slug, isAuthenticated, user, navigate]);

  // Fetch purchase info to get Drive link
  useEffect(() => {
    const fetchPurchaseInfo = async () => {
      if (!isAuthenticated || !user || !book?.isPurchased) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/orders/my-purchases`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          const bookPurchase = data.purchases.find(
            (purchase) =>
              purchase.itemType === "book" &&
              purchase.bookInfo?.slug === book.slug
          );

          if (bookPurchase) {
            setPurchaseInfo(bookPurchase);
          }
        }
      } catch (error) {
        toast.error("Failed to load book content");
      }
    };

    if (book?.isPurchased && isAuthenticated && user) {
      fetchPurchaseInfo();
    }
  }, [book?.isPurchased, isAuthenticated, user, book?.slug]);

  // Fetch folder contents when purchase info is available
  useEffect(() => {
    if (
      purchaseInfo?.solutionLink?.isEnabled &&
      purchaseInfo?.solutionLink?.driveUrl
    ) {
      const folderId = extractFolderId(purchaseInfo.solutionLink.driveUrl);
      if (folderId) {
        fetchFolderContents(folderId);
      }
    }
  }, [purchaseInfo]);

  // Add keyboard event listeners to prevent copy/paste shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent common copy/paste shortcuts
      if (
        e.ctrlKey &&
        (e.key === "c" ||
          e.key === "a" ||
          e.key === "x" ||
          e.key === "v" ||
          e.key === "s" ||
          e.key === "p")
      ) {
        e.preventDefault();
        return false;
      }
      // Prevent F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Prevent right-click menu key
      if (e.key === "ContextMenu") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Also disable print
    const handleBeforePrint = (e) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  // Extract Google Drive folder ID from URL
  const extractFolderId = (driveUrl) => {
    if (driveUrl.includes("/folders/")) {
      return driveUrl.split("/folders/")[1].split("?")[0];
    }
    return null;
  };

  // Fetch folder contents from Google Drive
  const fetchFolderContents = async (folderId) => {
    try {
      setContentLoading(true);

      const documentIds = await extractDocumentIds(folderId);
      setDocumentIds(documentIds);

      let chaptersContent = null;
      let excerptContent = null;

      if (documentIds.chapters) {
        chaptersContent = await fetchDocumentById(documentIds.chapters);
      }

      if (documentIds.excerpt) {
        excerptContent = await fetchDocumentById(documentIds.excerpt);
      }

      setBookContent({
        image: null,
        chapters: chaptersContent,
        excerpt: excerptContent || book?.excerpt,
        settings: null,
      });
    } catch (error) {
      setBookContent({
        image: null,
        chapters: null,
        excerpt: book?.excerpt,
        settings: null,
      });
    } finally {
      setContentLoading(false);
    }
  };

  // Extract document IDs from Google Drive folder
  const extractDocumentIds = async (folderId) => {
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

    if (!apiKey) {
      return { chapters: null, excerpt: null, image: null };
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType)`
      );

      if (!response.ok) {
        return { chapters: null, excerpt: null, image: null };
      }

      const data = await response.json();
      const files = data.files || [];

      const chaptersFile = files.find(
        (file) =>
          file.name.toLowerCase().includes("chapter") &&
          file.mimeType === "application/vnd.google-apps.document"
      );

      const excerptFile = files.find(
        (file) =>
          file.name.toLowerCase().includes("excerpt") &&
          file.mimeType === "application/vnd.google-apps.document"
      );

      const imageFile = files.find((file) =>
        file.mimeType.startsWith("image/")
      );

      return {
        chapters: chaptersFile?.id || null,
        excerpt: excerptFile?.id || null,
        image: imageFile?.id || null,
      };
    } catch (error) {
      return { chapters: null, excerpt: null, image: null };
    }
  };

  // Fetch document content by ID (returns null - content will be shown via iframe)
  const fetchDocumentById = async (documentId) => {
    // Since we're using iframe for display, we don't need to fetch text content
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/books")}
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors duration-300 cursor-pointer"
        >
          Back to Books
        </button>
      </div>
    );
  }

  if (!book || !book.isPurchased) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You need to purchase this book to read it.
        </p>
        <button
          onClick={() => navigate(`/books/${slug}`)}
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors duration-300 cursor-pointer"
        >
          Go to Book Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(`/books/${slug}`)}
              className="inline-flex items-center text-amber-700 hover:text-amber-900 transition-colors duration-300 cursor-pointer px-4 py-2 rounded hover:bg-amber-100 mr-4"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Book Details
            </button>

            <h1 className="text-xl font-serif font-bold text-amber-900 truncate">
              {book?.title || "Loading..."}
            </h1>
          </div>
        </div>
      </div>

      {/* Book Reader Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden book-container"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onSelectStart={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
        >
          {loading || contentLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-amber-700 font-serif">
                  Loading your book...
                </p>
              </div>
            </div>
          ) : !book?.isPurchased ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="text-center max-w-md">
                <svg
                  className="w-16 h-16 mx-auto text-amber-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-serif">
                  Access Required
                </h3>
                <p className="text-gray-600 mb-6">
                  You need to purchase this book to read it.
                </p>
                <button
                  onClick={() => navigate(`/books/${slug}`)}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300 cursor-pointer font-serif"
                >
                  Go to Book Page
                </button>
              </div>
            </div>
          ) : (
            <div className="book-content-wrapper">
              {/* Book Cover Image Section */}
              <div className="text-center py-8 bg-gradient-to-b from-amber-50 to-white">
                <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                  <img
                    src={
                      book.coverImage?.startsWith("/api/")
                        ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${
                            book.coverImage
                          }`
                        : book.coverImage
                    }
                    alt={book.title}
                    className="max-w-xs h-auto rounded shadow-md"
                    style={{ maxHeight: "400px" }}
                    onError={(e) => {
                      e.target.src = "/default-book-cover.jpg";
                    }}
                  />
                </div>
                <h2 className="mt-6 text-2xl font-serif font-bold text-amber-900">
                  {book.title}
                </h2>
                <p className="text-amber-700 font-serif mt-2">
                  by {book.author}
                </p>
              </div>

              {/* Book Content Sections */}
              <div className="px-8 py-6 space-y-8">
                {/* Excerpt Section */}
                <div className="prose prose-amber max-w-none">
                  <h3 className="text-xl text-center font-serif font-bold text-amber-900 mb-4 pb-2 border-b border-amber-200">
                    📖 Excerpt
                  </h3>
                  <div className="bg-amber-50 text-center rounded-lg p-6 leading-relaxed text-gray-800 font-serif">
                    {bookContent.excerpt || (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: book.excerpt || "Loading excerpt...",
                        }}
                        className="select-none"
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none"
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Chapters Section */}
                <div className="prose prose-amber max-w-none">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200">
                    <h3 className="text-xl font-serif font-bold text-amber-900">
                      📚 Chapters
                    </h3>
                    <button
                      onClick={toggleFullscreen}
                      className="inline-flex cursor-pointer items-center px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors duration-200"
                      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                      {isFullscreen ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l4.25-4.25M9 15H4.5M9 15v4.5M9 15l-4.25 4.25M15 15h4.5M15 15v4.5m0-4.5l4.25 4.25" />
                          </svg>
                          Exit Fullscreen
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                          Fullscreen
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : 'bg-white rounded-lg p-8 shadow-inner border border-amber-100'}`}>
                    {isFullscreen && (
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <h3 className="text-xl font-serif font-bold text-gray-900">
                          📚 {book?.title} - Chapters
                        </h3>
                        <button
                          onClick={toggleFullscreen}
                          className="inline-flex cursor-pointer items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          title="Exit Fullscreen"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Close
                        </button>
                      </div>
                    )}
                    {bookContent.chapters &&
                    !bookContent.chapters.includes("Unable to load") &&
                    !bookContent.chapters.includes("Loading chapters") ? (
                      <div
                        className="leading-relaxed text-gray-800 font-serif select-none"
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: bookContent.chapters
                            .replace(
                              /# (.*)/g,
                              '<h1 class="text-3xl font-bold text-amber-900 mb-6 mt-8 font-serif border-b-2 border-amber-300 pb-2">$1</h1>'
                            )
                            .replace(
                              /## (.*)/g,
                              '<h2 class="text-2xl font-semibold text-amber-800 mb-4 mt-6 font-serif">$1</h2>'
                            )
                            .replace(
                              /### (.*)/g,
                              '<h3 class="text-xl font-medium text-amber-700 mb-3 mt-5 font-serif">$1</h3>'
                            )
                            .replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="font-bold text-gray-900 bg-amber-50 px-1 rounded">$1</strong>'
                            )
                            .replace(
                              /\*(.*?)\*/g,
                              '<em class="italic text-amber-700 font-medium">$1</em>'
                            )
                            .replace(
                              /^- (.*)/gm,
                              '<li class="mb-2 text-gray-700 leading-relaxed">$1</li>'
                            )
                            .replace(
                              /^(\d+)\. (.*)/gm,
                              '<li class="mb-2 text-gray-700 leading-relaxed">$2</li>'
                            )
                            .split("\n\n")
                            .map((paragraph) => {
                              if (paragraph.trim() === "") return "";
                              if (
                                paragraph.includes("<h") ||
                                paragraph.includes("<li") ||
                                paragraph.includes("<hr")
                              ) {
                                return paragraph;
                              }
                              return `<p class="mb-4 text-gray-800 leading-relaxed font-serif text-justify">${paragraph}</p>`;
                            })
                            .join("")
                            .replace(
                              /(<li[^>]*>.*?<\/li>)/gs,
                              '<ul class="list-disc ml-6 mb-4 space-y-1">$1</ul>'
                            )
                            .replace(/<\/ul>\s*<ul[^>]*>/g, "")
                            .replace(
                              /---/g,
                              '<hr class="my-8 border-amber-300 border-2">'
                            )
                            .replace(/"/g, '"')
                            .replace(/"/g, '"')
                            .replace(/'/g, '"')
                            .replace(/'/g, '"'),
                        }}
                      />
                    ) : purchaseInfo?.solutionLink?.isEnabled &&
                      documentIds.chapters ? (
                      <iframe
                        src={`https://docs.google.com/document/d/${documentIds.chapters}/preview`}
                        className={`w-full border-0 rounded-lg ${isFullscreen ? 'fullscreen-iframe' : ''}`}
                        style={{
                          height: isFullscreen ? "calc(100vh - 80px)" : "800px",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                        }}
                        title="Book Chapters"
                        onContextMenu={(e) => e.preventDefault()}
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <div className="text-center py-8 text-amber-600">
                        <div className="animate-pulse">
                          <div className="h-4 bg-amber-200 rounded mb-2"></div>
                          <div className="h-4 bg-amber-200 rounded mb-2"></div>
                          <div className="h-4 bg-amber-200 rounded w-3/4"></div>
                        </div>
                        <p className="mt-4 font-serif">Loading chapters...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookReader;
