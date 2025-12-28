"use client";

import { useState, useEffect, useRef } from "react";
import { createVideoAnnotation, getVideoAnnotations, deleteVideoAnnotation } from "@/actions/videoActions";
import { sendCourseChatMessage } from "@/actions/videoChatActions";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface CourseToolsPanelProps {
  videoId: string;
  videoTitle: string;
  courseTitle: string;
  currentTime: number;
  onSeek: (time: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseToolsPanel({
  videoId,
  videoTitle,
  courseTitle,
  currentTime,
  onSeek,
  isOpen,
  onClose,
}: CourseToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "chat">("notes");
  
  // Notes State
  const [notes, setNotes] = useState<any[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Notes
  useEffect(() => {
    if (videoId && activeTab === "notes") {
      loadNotes();
    }
  }, [videoId, activeTab]);

  async function loadNotes() {
    setLoadingNotes(true);
    const result = await getVideoAnnotations(videoId);
    if (result.success) {
      setNotes(result.annotations);
    }
    setLoadingNotes(false);
  }

  // Create Note
  async function handleAddNote() {
    if (!noteInput.trim()) return;
    
    // Optimistic UI
    const tempId = Date.now().toString();
    const newNote = {
      _id: tempId,
      selectedText: noteInput,
      timestamp: currentTime,
      createdAt: new Date().toISOString(),
    };
    
    setNotes(prev => [...prev, newNote]);
    setNoteInput("");
    toast.success("Note added");

    const result = await createVideoAnnotation(videoId, noteInput, currentTime);
    if (!result.success) {
        setNotes(prev => prev.filter(n => n._id !== tempId));
        toast.error("Failed to save note");
    } else {
        // Replace temp with real
        setNotes(prev => prev.map(n => n._id === tempId ? result.annotation : n));
    }
  }

  // Delete Note
  async function handleDeleteNote(id: string) {
    const prevNotes = [...notes];
    setNotes(prev => prev.filter(n => n._id !== id));
    toast.success("Note deleted");

    const result = await deleteVideoAnnotation(id);
    if (!result.success) {
        setNotes(prevNotes);
        toast.error("Failed to delete");
    }
  }

  // Send Chat
  async function handleSendChat() {
    if (!chatInput.trim() || sendingMsg) return;

    const userMsg = { role: "user" as const, content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setSendingMsg(true);

    const result = await sendCourseChatMessage(
        [...messages, userMsg], 
        chatInput, 
        { courseTitle, videoTitle }
    );

    if (result.success) {
        setMessages(prev => [...prev, { role: "ai", content: result.message! }]);
    } else {
        toast.error("Failed to get response");
    }
    setSendingMsg(false);
  }

  // Auto-scroll chat
  useEffect(() => {
     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab("notes")}
            className={`pb-2 text-sm font-medium ${activeTab === "notes" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`pb-2 text-sm font-medium ${activeTab === "chat" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            AI Assistant
          </button>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto h-[calc(100vh-130px)] p-4">
        {activeTab === "notes" ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
               <textarea
                 value={noteInput}
                 onChange={(e) => setNoteInput(e.target.value)}
                 placeholder="Write a note at current time..."
                 className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm p-0 mb-2 text-gray-900 placeholder-gray-500"
                 rows={3}
               />
               <div className="flex justify-between items-center">
                 <span className="text-xs text-indigo-600 font-medium">@{formatTime(currentTime)}</span>
                 <button onClick={handleAddNote} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700">Save Note</button>
               </div>
            </div>

            <div className="space-y-3">
               {loadingNotes ? <div className="text-center text-gray-400">Loading notes...</div> : 
                 notes.map((note) => (
                   <div key={note._id} className="group relative bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <button onClick={() => handleDeleteNote(note._id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <div onClick={() => onSeek(note.timestamp || 0)} className="cursor-pointer">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mb-1">
                             {formatTime(note.timestamp || 0)}
                          </span>
                          <p className="text-sm text-gray-700">{note.selectedText}</p>
                      </div>
                   </div>
                 ))
               }
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 overflow-y-auto mb-4">
               {messages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                   <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                   </div>
                 </div>
               ))}
               <div ref={chatEndRef} />
            </div>
            <div className="mt-auto pt-2 border-t border-gray-100">
               <div className="flex gap-2">
                 <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask about this video..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-900 placeholder-gray-500 bg-white"
                 />
                 <button onClick={handleSendChat} disabled={sendingMsg} className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
