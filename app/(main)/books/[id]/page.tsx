"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookById, updateBookProgress } from "@/actions/books";
import { Document, Page, pdfjs } from "react-pdf";
import toast from "react-hot-toast";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BookData {
  _id: string;
  title: string;
  fileUrl: string;
  totalPages: number;
  currentPage: number;
  progress: number;
  lastReadPosition: {
    page: number;
    scrollTop: number;
    highlightedText: string;
  };
}

export default function BookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [book, setBook] = useState<BookData | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [highlightedText, setHighlightedText] = useState("");

  // Load book data
  useEffect(() => {
    const loadBook = async () => {
      try {
        const result = await getBookById(bookId);
        if (result) {
          const bookData = result as BookData;
          setBook(bookData);
          // Resume from last read page
          if (bookData.lastReadPosition?.page) {
            setPageNumber(bookData.lastReadPosition.page);
          } else if (bookData.currentPage > 0) {
            setPageNumber(bookData.currentPage);
          }
          if (bookData.lastReadPosition?.highlightedText) {
            setHighlightedText(bookData.lastReadPosition.highlightedText);
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

  // Auto-save progress every 3 seconds
  useEffect(() => {
    if (!book || !numPages) return;

    const saveProgress = async () => {
      try {
        await updateBookProgress(bookId, {
          currentPage: pageNumber,
          totalPages: numPages,
          scrollTop: 0,
          highlightedText: highlightedText,
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    };

    const interval = setInterval(saveProgress, 3000);
    return () => clearInterval(interval);
  }, [bookId, book, numPages, pageNumber, highlightedText]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      // Update total pages in database if different
      if (book && book.totalPages !== numPages) {
        updateBookProgress(bookId, {
          currentPage: pageNumber,
          totalPages: numPages,
          scrollTop: 0,
          highlightedText: highlightedText,
        });
      }
    },
    [book, bookId, pageNumber, highlightedText]
  );

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || prev, prev + 1));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setHighlightedText(selection.toString().trim());
      toast.success("Text marked");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const progress = numPages ? ((pageNumber / numPages) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/books")}
                className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
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
              </button>
              <div>
                <h1 className="text-white font-semibold truncate max-w-xs sm:max-w-md">
                  {book.title}
                </h1>
                <p className="text-sm text-gray-400">
                  Page {pageNumber} of {numPages} · {progress}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Zoom out"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                </svg>
              </button>
              <span className="text-gray-300 text-sm min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
                className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Zoom in"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-700 h-1">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-1 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 overflow-auto bg-gray-900">
        <div className="max-w-5xl mx-auto py-8 px-4">
          <div
            className="bg-white rounded-lg shadow-2xl"
            onMouseUp={handleTextSelection}
          >
            <Document
              file={book.fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center py-20 text-red-600">
                  <p>Failed to load PDF. Please try again.</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="mx-auto"
              />
            </Document>
          </div>

          {/* Highlighted text display */}
          {highlightedText && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Last Marked Text:
                  </p>
                  <p className="text-sm text-yellow-900">{highlightedText}</p>
                </div>
                <button
                  onClick={() => setHighlightedText("")}
                  className="text-yellow-600 hover:text-yellow-800"
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
        </div>
      </main>

      {/* Navigation Controls */}
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= (numPages || 1)) {
                    setPageNumber(page);
                  }
                }}
                className="w-20 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min={1}
                max={numPages || 1}
              />
              <span className="text-gray-400">/ {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              <span>Next</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
