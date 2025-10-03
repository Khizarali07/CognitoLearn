"use client";

import { useState, useTransition, useEffect } from "react";
import { getUserBooks, uploadBook, deleteBook } from "@/actions/books";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import toast from "react-hot-toast";

interface Book {
  _id: string;
  title: string;
  totalPages: number;
  currentPage: number;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
  lastAccessedAt: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress">(
    "all"
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    let filtered = books;

    // Filter by status
    if (filterStatus === "in-progress") {
      filtered = filtered.filter(
        (book) => !book.isCompleted && book.progress > 0
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBooks(filtered);
  }, [books, filterStatus, searchQuery]);

  const loadBooks = () => {
    startTransition(async () => {
      const result = await getUserBooks();
      if (Array.isArray(result)) {
        setBooks(result as Book[]);
      }
    });
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploadProgress(true);

    try {
      const result = await uploadBook(formData);
      if (result.success) {
        toast.success("Book uploaded successfully!");
        setShowUploadModal(false);
        loadBooks();
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to upload book");
      }
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    startTransition(async () => {
      const result = await deleteBook(bookId);
      if (result.success) {
        toast.success("Book deleted successfully");
        loadBooks();
      } else {
        toast.error(result.error || "Failed to delete book");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
              <p className="text-gray-600 mt-1">
                Upload and track your reading progress
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload Book
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search books by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filterStatus === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All Books
              </button>
              <button
                onClick={() => setFilterStatus("in-progress")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filterStatus === "in-progress"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                In Progress
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Books</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {books.length}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {books.filter((b) => b.isCompleted).length}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {books.filter((b) => !b.isCompleted && b.progress > 0).length}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {isPending && !uploadProgress ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No books found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by uploading a book"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <Link href={`/books/${book._id}`} className="block">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-3">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      {book.isCompleted && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        Page {book.currentPage} of {book.totalPages}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {book.progress.toFixed(0)}% complete
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <Link
                    href={`/books/${book._id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Continue Reading →
                  </Link>
                  <button
                    onClick={() => handleDelete(book._id, book.title)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete book"
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
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload Book</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadProgress}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress ? "Uploading..." : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
