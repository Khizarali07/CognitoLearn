"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import {
  getBookById,
  updateReadingProgress,
  createAnnotation,
  getBookAnnotations,
  deleteAnnotation,
} from "@/actions/bookActions";
import { getStorage, APPWRITE_CONFIG } from "@/lib/appwrite";
import toast from "react-hot-toast";
import Link from "next/link";

interface BookData {
  id: string;
  title: string;
  storageId: string;
  currentPage: number;
  createdAt: string;
}

interface Annotation {
  id: string;
  text: string;
  pageNumber: number;
  createdAt: string;
}

export default function BookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [book, setBook] = useState<BookData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pdfKey, setPdfKey] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Load book data
  useEffect(() => {
    const loadBook = async () => {
      try {
        const result = await getBookById(bookId);

        if (result.success && result.book) {
          setBook(result.book);
          setCurrentPage(result.book.currentPage || 1);

          // Get PDF URL from Appwrite storage
          const storage = getStorage();
          const fileUrl = storage.getFileView(
            APPWRITE_CONFIG.booksBucketId,
            result.book.storageId
          );
          setPdfUrl(fileUrl.toString());

          // Load annotations
          const annotationsResult = await getBookAnnotations(bookId);
          if (annotationsResult.success && annotationsResult.annotations) {
            setAnnotations(
              annotationsResult.annotations.map((ann) => ({
                id: ann.id,
                text: ann.selectedText,
                pageNumber: ann.pageNumber,
                createdAt: ann.createdAt,
              }))
            );
          }
        } else {
          toast.error("Book not found");
          router.push("/books");
        }
      } catch (error) {
        console.error("Error loading book:", error);
        toast.error("Failed to load book");
        router.push("/books");
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId, router]);

  // Auto-save progress with debounce
  useEffect(() => {
    if (!book || !totalPages || currentPage === 0) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateReadingProgress(bookId, currentPage);
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [bookId, book, currentPage, totalPages]);

  // Handle text selection
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);

      try {
        const result = await createAnnotation(bookId, currentPage, text);

        if (result.success) {
          toast.success("Annotation saved");
          // Refresh annotations
          const annotationsResult = await getBookAnnotations(bookId);
          if (annotationsResult.success && annotationsResult.annotations) {
            setAnnotations(
              annotationsResult.annotations.map((ann) => ({
                id: ann.id,
                text: ann.selectedText,
                pageNumber: ann.pageNumber,
                createdAt: ann.createdAt,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to save annotation:", error);
      }
    }
  };

  // Handle page change
  const handlePageChange = (e: {
    currentPage: number;
    doc: { numPages: number };
  }) => {
    setCurrentPage(e.currentPage + 1); // PDF viewer uses 0-based index
    if (totalPages === 0) {
      setTotalPages(e.doc.numPages);
    }
  };

  // Handle document load
  const handleDocumentLoad = (e: { doc: { numPages: number } }) => {
    setTotalPages(e.doc.numPages);
  };

  // Handle delete annotation
  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const result = await deleteAnnotation(annotationId);
      if (result.success) {
        toast.success("Annotation deleted");
        // Refresh annotations
        const annotationsResult = await getBookAnnotations(bookId);
        if (annotationsResult.success && annotationsResult.annotations) {
          setAnnotations(
            annotationsResult.annotations.map((ann) => ({
              id: ann.id,
              text: ann.selectedText,
              pageNumber: ann.pageNumber,
              createdAt: ann.createdAt,
            }))
          );
        }
      } else {
        toast.error(result.error || "Failed to delete annotation");
      }
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      toast.error("Failed to delete annotation");
    }
  };

  // Handle go to page from annotation
  const goToAnnotationPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Force PDF viewer to re-render with new initial page
    setPdfKey(prev => prev + 1);
    toast.success(`Jumped to page ${pageNumber}`);
  };

  // Handle bookmark (save current position)
  const handleBookmark = async () => {
    try {
      const result = await updateReadingProgress(bookId, currentPage);
      if (result.success) {
        toast.success(`Bookmarked at page ${currentPage}`);
      } else {
        toast.error("Failed to save bookmark");
      }
    } catch (error) {
      console.error("Failed to save bookmark:", error);
      toast.error("Failed to save bookmark");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book || !pdfUrl) {
    return null;
  }

  const progress = totalPages
    ? ((currentPage / totalPages) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/books"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-gray-900 font-semibold text-lg truncate max-w-xs sm:max-w-md lg:max-w-2xl">
                  {book.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} · {progress}% complete
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-sm font-medium rounded-lg transition-colors"
                title="Bookmark this page"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="hidden sm:inline">Bookmark</span>
              </button>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                {annotations.length} notes
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-1 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          onMouseUp={handleTextSelection}
          style={{ height: "calc(100vh - 200px)" }}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              key={pdfKey}
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onPageChange={handlePageChange}
              onDocumentLoad={handleDocumentLoad}
              initialPage={currentPage - 1}
              defaultScale={1.2}
            />
          </Worker>
        </div>

        {/* Annotations Panel */}
        {annotations.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Your Notes & Highlights
            </h2>
            <div className="space-y-4">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg hover:bg-indigo-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">
                        {annotation.text}
                      </p>
                      <p className="text-sm text-gray-600">
                        Page {annotation.pageNumber} ·{" "}
                        {new Date(annotation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          goToAnnotationPage(annotation.pageNumber)
                        }
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        title="Go to this page"
                      >
                        Go to page
                      </button>
                      <button
                        onClick={() => handleDeleteAnnotation(annotation.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete annotation"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Text Display */}
        {selectedText && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  ✨ Annotation Saved
                </p>
                <p className="text-sm text-yellow-900">{selectedText}</p>
              </div>
              <button
                onClick={() => setSelectedText("")}
                className="ml-4 text-yellow-600 hover:text-yellow-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
