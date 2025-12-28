"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTitle: string) => Promise<void>;
  initialTitle: string;
  title: string;
}

export default function EditModal({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  title
}: EditModalProps) {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewTitle(initialTitle);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newTitle);
      toast.success("Updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {title}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                placeholder="Enter new title"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving...
                    </>
                ) : (
                    "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
