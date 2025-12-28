"use client";

import { useState, useTransition, useEffect } from "react";
import { getUserBooks, deleteBook, updateBook } from "@/actions/bookActions";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditModal from "@/components/EditModal";
import BookUploader from "./components/BookUploader";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  storageId: string;
  currentPage: number;
  createdAt: string;
  annotationsCount?: number;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    bookId: string;
    title: string;
  }>({
    isOpen: false,
    bookId: "",
    title: "",
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    bookId: string;
    title: string;
  }>({ isOpen: false, bookId: "", title: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    let filtered = books;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery]);

  const loadBooks = () => {
    startTransition(async () => {
      const result = await getUserBooks();
      if (result.success && result.books) {
        setBooks(result.books);
      } else {
        toast.error(result.error || "Failed to load books");
      }
    });
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadBooks();
    toast.success("Book uploaded successfully!");
  };

  const handleDelete = async (bookId: string, title: string) => {
    setDeleteModal({ isOpen: true, bookId, title });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBook(deleteModal.bookId);
      if (result.success) {
        toast.success("Book deleted successfully");
        loadBooks();
        setDeleteModal({ isOpen: false, bookId: "", title: "" });
      } else {
        toast.error(result.error || "Failed to delete book");
      }
    } catch {
      toast.error("Failed to delete book");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar />

      <main className="flex-1 lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                     <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Library</h1>
                     <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Manage your PDF books and documents</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Book
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Total Books" 
                    value={books.length} 
                    icon={<svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                 <StatCard 
                    title="Total Annotations" 
                    value={books.reduce((acc, curr) => acc + (curr.annotationsCount || 0), 0)} 
                    icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
                 <StatCard 
                    title="Recently Added" 
                    value={books.filter(b => new Date(b.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} 
                    icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                 <StatCard 
                    title="In Progress" 
                    value={books.filter(b => b.currentPage > 1).length} 
                    icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                 <div className="relative w-full">
                     <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input
                        type="text"
                        placeholder="Search books by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                     />
                 </div>
            </div>

            {/* Grid */}
            {isPending ? (
                 <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : filteredBooks.length === 0 ? (
                 <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                     <svg className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                     <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">No books found</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map(book => (
                        <div key={book.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col overflow-hidden">
                            <Link href={`/book/${book.id}`} className="block p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                     <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                     </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {book.title}
                                </h3>
                                <div className="space-y-4"> 
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                         <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                         Added {new Date(book.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                         <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                              Page {book.currentPage || 1}
                                         </div>
                                         <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                              {book.annotationsCount || 0} Notes
                                         </div>
                                    </div>
                                </div>
                            </Link>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <Link href={`/book/${book.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    Read Book &rarr;
                                </Link>
                                <div className="flex items-center space-x-2">
                                     <button 
                                        onClick={() => setEditModal({ isOpen: true, bookId: book.id, title: book.title })} 
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Edit Book"
                                    >
                                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                     <button 
                                        onClick={() => handleDelete(book.id, book.title)} 
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete Book"
                                    >
                                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <BookUploader
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadBooks();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Book"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, bookId: "", title: "" })
        }
        isDeleting={isDeleting}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={editModal.isOpen}
        title="Edit Book"
        initialTitle={editModal.title}
        onClose={() => setEditModal({ isOpen: false, bookId: "", title: "" })}
        onSave={async (newTitle) => {
            const result = await updateBook(editModal.bookId, newTitle);
            if (result.success) {
                setBooks(prev => prev.map(b => b.id === editModal.bookId ? { ...b, title: newTitle } : b));
            } else {
                throw new Error(result.error);
            }
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
    </div>
  )
}
