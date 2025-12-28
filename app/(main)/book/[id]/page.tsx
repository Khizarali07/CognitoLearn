"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Viewer,
    Worker,
    ScrollMode,
    SpecialZoomLevel,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import {
  getBookById,
  updateReadingProgress,
  createAnnotation,
  getBookAnnotations,
  deleteAnnotation,
  deleteAnnotation,
  saveAnnotationExplanation,
  updateBook,
} from "@/actions/bookActions";
import { explainText } from "@/actions/aiActions";
import { getBookMessages, sendChatMessage } from "@/actions/chatActions";
import { getStorage, APPWRITE_CONFIG } from "@/lib/appwrite";
import toast from "react-hot-toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import EditModal from "@/components/EditModal";

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
  explanation?: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
  annotationId?: string;
}

export default function BookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  // Tabs
  const [activeTab, setActiveTab] = useState<"notes" | "chat">("notes");

  // Data
  const [book, setBook] = useState<BookData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    bookId: string;
    title: string;
  }>({ isOpen: false, bookId: "", title: "" });

  // Selection
  const [selectedText, setSelectedText] = useState("");
  
  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(currentPage);
  const isInitializedRef = useRef(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  // Full Screen Toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        fullScreenRef.current?.requestFullscreen().catch(() => {
            toast.error("Error attempting full screen");
        });
    } else {
        document.exitFullscreen();
    }
  };

  // AI State (Legacy / Quick Explain)
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;
  const { zoomTo } = zoomPluginInstance;

  // Navigation Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
        jumpToPage(currentPage - 2); // 0-indexed
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
        jumpToPage(currentPage); // 0-indexed, so next page is current index (current is 1-based)
    }
  };

  // Auto-Zoom on Full Screen Change
  useEffect(() => {
      const handleFullScreenChange = () => {
          // Whether entering or exiting, force "Page Fit" for optimal viewing
          setTimeout(() => {
              zoomTo(SpecialZoomLevel.PageFit);
          }, 100); // Slight delay to allow layout to settle
      };

      document.addEventListener("fullscreenchange", handleFullScreenChange);
      return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [zoomTo]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const result = await getBookById(bookId);

        if (result.success && result.book) {
          setBook(result.book);
          const savedPage = result.book.currentPage || 1;
          setCurrentPage(savedPage);
          currentPageRef.current = savedPage;

          const storage = getStorage();
          const fileUrl = storage.getFileView(
            APPWRITE_CONFIG.booksBucketId,
            result.book.storageId
          );
          setPdfUrl(fileUrl.toString());

          // Load Annotations
          const annotationsResult = await getBookAnnotations(bookId);
          if (annotationsResult.success && annotationsResult.annotations) {
            setAnnotations(
              annotationsResult.annotations.map((ann) => ({
                id: ann.id,
                text: ann.selectedText,
                pageNumber: ann.pageNumber,
                explanation: ann.explanation,
                createdAt: ann.createdAt,
              }))
            );
          }

          // Load Chat
          const chatResult = await getBookMessages(bookId);
          if (chatResult.success && chatResult.messages) {
             setMessages(chatResult.messages as Message[]);
          }

        } else {
          toast.error("Book not found");
          router.push("/books");
        }
      } catch (error) {
        console.error("Error loading boook:", error);
        toast.error("Failed to load book");
        router.push("/books");
      } finally {
        // Ensure loading is cleared
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId, router]);

  useEffect(() => {
    return () => {
      if (bookId && currentPageRef.current > 1) {
        updateReadingProgress(bookId, currentPageRef.current).catch(console.error);
      }
    };
  }, [bookId]);

  useEffect(() => {
    if (!book || !totalPages || currentPage === 0 || !isInitializedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateReadingProgress(bookId, currentPage);
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [bookId, book, currentPage, totalPages]);

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      try {
        const result = await createAnnotation(bookId, currentPage, text);
        if (result.success) {
          toast.success("Saved to Data");
          // Refresh annotations
          const annotationsResult = await getBookAnnotations(bookId);
          if (annotationsResult.success && annotationsResult.annotations) {
            setAnnotations(
              annotationsResult.annotations.map((ann) => ({
                id: ann.id,
                text: ann.selectedText,
                pageNumber: ann.pageNumber,
                explanation: ann.explanation,
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

  const handlePageChange = (e: { currentPage: number; doc: { numPages: number } }) => {
    if (!isInitializedRef.current) return;
    setCurrentPage(e.currentPage + 1);
    if (totalPages === 0) setTotalPages(e.doc.numPages);
  };

  const handleDocumentLoad = (e: { doc: { numPages: number } }) => {
    setTotalPages(e.doc.numPages);
    setLoading(false); // Ensure loading is disabled when doc loads
    if (currentPage > 1) {
      setTimeout(() => {
        jumpToPage(currentPage - 1);
        isInitializedRef.current = true;
      }, 100);
    } else {
       isInitializedRef.current = true;
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    // Optimistic Update: Immediately remove from UI
    const previousAnnotations = [...annotations];
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    toast.success("Note deleted"); // Feedback immediately

    try {
      const result = await deleteAnnotation(annotationId);
      if (!result.success) {
        // Revert if failed
        setAnnotations(previousAnnotations);
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      setAnnotations(previousAnnotations);
      toast.error("Failed to delete");
    }
  };

  const goToAnnotationPage = (pageNumber: number) => {
    jumpToPage(pageNumber - 1);
  };

  const handleBookmark = async () => {
    try {
      await updateReadingProgress(bookId, currentPage);
      toast.success("Bookmarked!");
    } catch (error) {
      toast.error("Error saving bookmark");
    }
  };

  // Quick Explain (Inline) - Maintained for quick lookup
  const handleQuickExplain = async (text: string, annotationId?: string) => {
    setExplaining(true);
    setExplanation(null);
    setActiveTab("notes"); // Ensure notes tab is open

    if (annotationId) {
      const existing = annotations.find(a => a.id === annotationId);
      if (existing?.explanation) {
        setExplanation(existing.explanation);
        setExplaining(false);
        return;
      }
    }

    try {
      const result = await explainText(text);
      if (result.success) {
        setExplanation(result.explanation || "No explanation available.");
        if (annotationId && result.explanation) {
             const saveResult = await saveAnnotationExplanation(annotationId, result.explanation);
             if (saveResult.success) {
                 setAnnotations(prev => prev.map(a => 
                    a.id === annotationId ? { ...a, explanation: result.explanation } : a
                 ));
             }
        }
      } else {
         toast.error(result.error || "Failed");
      }
    } catch (error) {
      toast.error("AI Error");
    } finally {
      setExplaining(false);
    }
  };

  // Chat Functionality
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const msg = chatInput.trim();
    setChatInput("");
    setSendingMsg(true);

    // Optimistic Update
    const tempId = Date.now().toString();
    setMessages(prev => [
      ...prev, 
      { id: tempId, role: "user", content: msg, createdAt: new Date().toISOString(), annotationId: selectedAnnotationId || undefined }
    ]);

    try {
        const result = await sendChatMessage(bookId, msg, selectedAnnotationId || undefined);
        if (result.success && result.aiMessage) {
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                { id: result.userMessage.$id, role: "user", content: msg, createdAt: result.userMessage.$createdAt },
                { id: result.aiMessage.$id, role: "ai", content: result.aiMessage.content, createdAt: result.aiMessage.$createdAt }
            ]);
        } else {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Failed to send");
        }
    } catch (err) {
        toast.error("Failed to send");
    } finally {
        setSendingMsg(false);
    }
  };

  const startChatAboutText = (text: string, annotationId?: string) => {
     setActiveTab("chat");
     if (annotationId) {
         setSelectedAnnotationId(annotationId);
         setChatInput(""); 
     } else {
         setSelectedAnnotationId(null);
         setChatInput(`Explain this text: "${text}"`);
     }
  };

  // if (loading) return ... // REMOVED BLOCKING LOADER
  if (!book && loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!book) return null; // Should have redirected

  const progress = totalPages ? ((currentPage / totalPages) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/books" className="p-2 text-slate-400 hover:text-indigo-600 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-none truncate max-w-sm">{book.title}</h1>
                <span className="text-xs font-medium text-slate-500">Page {currentPage} / {totalPages}</span>
              </div>
            </div>
            <button onClick={handleBookmark} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full hover:bg-indigo-100 transition-colors">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                 Bookmark
            </button>
            <button onClick={toggleFullScreen} className="ml-2 p-2 text-slate-400 hover:text-indigo-600 rounded-full transition-colors" title="Full Screen">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      </header>

      {/* MAIN LAYOUT - Responsive: Column on mobile, Row on Desktop */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* PDF VIEWER SECTION */}
        <div ref={fullScreenRef} className="flex-1 relative bg-slate-100 flex flex-col min-h-0 overflow-hidden group order-2 lg:order-1 h-[50vh] lg:h-auto">
           
           {/* Navigation Overlays (Visible on Hover/Interaction) */}
           <div className="absolute inset-y-0 left-0 z-30 flex items-center pl-4 pointer-events-none">
             <button 
               onClick={handlePrevPage}
               disabled={currentPage <= 1}
               className="pointer-events-auto p-3 rounded-full bg-white/90 text-slate-700 shadow-xl hover:bg-indigo-600 hover:text-white disabled:opacity-0 disabled:translate-x-[-20px] transition-all duration-300 transform hover:scale-110 border border-slate-200 backdrop-blur-sm"
               title="Previous Page"
             >
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
           </div>

           <div className="absolute inset-y-0 right-0 z-30 flex items-center pr-4 pointer-events-none">
             <button 
               onClick={handleNextPage}
               disabled={currentPage >= totalPages}
               className="pointer-events-auto p-3 rounded-full bg-white/90 text-slate-700 shadow-xl hover:bg-indigo-600 hover:text-white disabled:opacity-0 disabled:translate-x-[20px] transition-all duration-300 transform hover:scale-110 border border-slate-200 backdrop-blur-sm"
               title="Next Page"
             >
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             </button>
           </div>

           {/* PDF Rendering Area - Use flex logic to ensure height is respected */}
           <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative" id="pdf-wrapper">
             <div onMouseUp={handleTextSelection} className="flex-1 w-full h-full bg-slate-50 relative">
               <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                 {/* Viewer must be wrapped in a div with defined height if styling is tricky, but flex-1 h-full works best */}
                 <div className="h-full w-full absolute inset-0">
                    <Viewer 
                        fileUrl={pdfUrl || ""}
                        plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance, zoomPluginInstance]} 
                        onPageChange={handlePageChange} 
                        onDocumentLoad={handleDocumentLoad}
                        initialPage={currentPage - 1} 
                        defaultScale={1.5}
                        scrollMode={ScrollMode.Page} 
                        theme={{ theme: 'light' }} 
                    />
                    
                    {/* CSS Hack to hide unwanted buttons from Default Toolbar */}
                    <style jsx global>{`
                        /* Hide Open File */
                        .rpv-core__tooltip-body:has(+ [data-testid="open-file"]),
                        [data-testid="open-file"] { display: none !important; }
                        
                        /* Hide Download */
                        .rpv-core__tooltip-body:has(+ [data-testid="download"]),
                        [data-testid="download"] { display: none !important; }
                        
                        /* Hide Print */
                        .rpv-core__tooltip-body:has(+ [data-testid="print"]),
                        [data-testid="print"] { display: none !important; }
                        
                        /* Hide Switch Theme */
                        .rpv-core__tooltip-body:has(+ [data-testid="switch-theme"]),
                        [data-testid="switch-theme"] { display: none !important; }
                        
                        /* Hide Full Screen (Native) - Targeting multiple potential selectors */
                        .rpv-core__tooltip-body:has(+ [data-testid="full-screen"]),
                        [data-testid="full-screen"],
                        [aria-label="Full screen"],
                        button[aria-label="Full screen"] { display: none !important; }
                        
                        /* Hide More Actions / Settings - often uses a menu icon */
                        [data-testid="more-actions"] { display: none !important; }
                        
                        /* Hide Page Navigation in Toolbar (we have our own) if desired, but user just said "all setting" */
                        /* Keeping Page Nav in toolbar for now as user didn't explicitly ban it, but they said "except zoom and search" */
                        /* Let's be aggressive based on "except zoom and search" */
                        
                        /* Hide Previous/Next Page in Toolbar */
                        [data-testid="previous-page"], [data-testid="next-page"] { display: none !important; }
                        
                        /* Removed aggressive hiding of generic buttons to restore Zoom/Search availability */
                    `}</style>
                 </div>
               </Worker>
             </div>

             {/* LOADING OVERLAY */}
             {loading && (
                 <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading PDF...</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                        Reload Book
                    </button>
                 </div>
             )}
           </div>
        </div>

        {/* SIDEBAR */}
        {/* SIDEBAR - Responsive Width */}
        <aside className="w-full lg:w-[400px] bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col h-[40vh] lg:h-full order-1 lg:order-2 border-b lg:border-b-0">
           {/* TABS */}
           <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => setActiveTab("notes")} className={clsx("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", activeTab === "notes" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700")}>
                  Notes ({annotations.length})
              </button>
              <button onClick={() => setActiveTab("chat")} className={clsx("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", activeTab === "chat" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700")}>
                  Chat Assistant
              </button>
           </div>

           {/* CONTENT */}
           <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
             
             {/* --- NOTES TAB --- */}
             {activeTab === "notes" && (
                <div className="p-5 space-y-6">
                   {/* Quick Explain Panel */}
                   <AnimatePresence>
                     {(explaining || explanation) && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100 shadow-sm overflow-hidden">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                               {explaining && <span className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span>}
                               AI Insight
                             </h3>
                             {explanation && <button onClick={() => setExplanation(null)} className="text-slate-400 hover:text-slate-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                          </div>
                          <div className="prose prose-sm prose-indigo text-slate-600 leading-relaxed text-sm">
                             {explaining ? <p className="animate-pulse">Analyzing text...</p> : <ReactMarkdown>{explanation || ""}</ReactMarkdown>}
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Selection Preview */}
                   {selectedText && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                         <p className="text-xs font-bold text-amber-700 mb-2">SELECTED TEXT</p>
                         <p className="text-sm text-slate-700 italic border-l-2 border-amber-300 pl-3 mb-3 line-clamp-3">"{selectedText}"</p>
                         <div className="flex gap-2">
                            <button onClick={() => handleQuickExplain(selectedText)} className="flex-1 py-1.5 bg-white text-amber-700 text-xs font-bold rounded border border-amber-200 shadow-sm hover:shadow flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Quick Explain
                            </button>
                            <button onClick={() => startChatAboutText(selectedText)} className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                Chat
                            </button>
                            <button onClick={() => setSelectedText("")} className="px-3 py-1.5 text-slate-400 hover:bg-slate-100 rounded">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                         </div>
                      </div>
                   )}

                   {/* List */}
                   <div className="space-y-3">
                      {annotations.map(ann => (
                        <div key={ann.id} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                           <p className="text-sm font-medium text-slate-800 line-clamp-3 mb-3">"{ann.text}"</p>
                           <div className="flex items-center justify-between">
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Page {ann.pageNumber}</span>
                              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleQuickExplain(ann.text, ann.id)} className="p-1.5 text-slate-400 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded" title="Quick Explain">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                 </button>
                                 <button onClick={() => startChatAboutText(ann.text, ann.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded" title="Discuss in Chat">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                 </button>
                                 <button onClick={() => goToAnnotationPage(ann.pageNumber)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded" title="Go to Page">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 </button>
                                 <div className="flex items-center space-x-1">
                                   <button
                onClick={() => book && setEditModal({ isOpen: true, bookId: book.id, title: book.title })}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Edit Book"
              >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                      {annotations.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Select text to add notes.</div>}
                   </div>
                </div>
             )}

             {/* --- CHAT TAB --- */}
             {activeTab === "chat" && (
               <div className="flex flex-col h-full bg-slate-50">
                  {/* Context Selector */}
                  <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
                      <div className="relative">
                          <select
                              value={selectedAnnotationId || ""}
                              onChange={(e) => setSelectedAnnotationId(e.target.value || null)}
                              className="w-full appearance-none pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                          >
                              <option value="">General Chat (No specific note)</option>
                              {annotations.map((ann) => (
                                  <option key={ann.id} value={ann.id}>
                                      Note: {ann.text.substring(0, 30)}{ann.text.length > 30 ? "..." : ""}
                                  </option>
                              ))}
                          </select>
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                  </div>

                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
                     {messages.length === 0 ? (
                        <div className="text-center py-16 px-6">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                           </div>
                           <h3 className="text-slate-800 font-bold mb-1">Book Chat</h3>
                           <p className="text-slate-500 text-sm">Ask questions about this book or select text to discuss it.</p>
                        </div>
                     ) : (
                        messages.map(msg => (
                          <div key={msg.id} className={clsx("flex gap-3 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                             <div className={clsx("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold", msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600")}>
                                {msg.role === "user" ? "You" : "AI"}
                             </div>
                             <div className={clsx("p-3 rounded-2xl text-sm leading-relaxed", msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 shadow-sm rounded-tl-none")}>
                                {msg.annotationId && (
                                     <div className="mb-2 pb-2 border-b border-white/10 text-xs opacity-80 flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span>Reference to note</span>
                                     </div>
                                )}
                                <div className={clsx("prose prose-sm max-w-none", msg.role === "user" ? "prose-invert" : "prose-indigo")}>
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                             </div>
                          </div>
                        ))
                     )}
                     {sendingMsg && (
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                               <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                           </div>
                           <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-slate-500 text-sm">Thinking...</div>
                        </div>
                     )}
                     <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                     <div className="relative">
                        <input 
                          type="text" 
                          value={chatInput} 
                          onChange={e => setChatInput(e.target.value)} 
                          placeholder="Ask something..." 
                          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        />
                        <button type="submit" disabled={!chatInput.trim() || sendingMsg} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                     </div>
                  </form>
               </div>
             )}

           </div>
        </aside>
      </main>
    </div>
  );
}
