"use client";

import { useState } from "react";

interface FolderPickerProps {
  onFolderSelect: (path: string) => void;
  currentPath: string;
}

export default function FolderPicker({
  onFolderSelect,
  currentPath,
}: FolderPickerProps) {
  const [isSupported, setIsSupported] = useState(true);

  const handleFolderPick = async () => {
    try {
      // Check if the File System Access API is supported
      const win = window as unknown as {
        showDirectoryPicker?: (options?: {
          mode?: "read" | "readwrite";
        }) => Promise<{ name: string }>;
      };

      if (typeof win.showDirectoryPicker === "function") {
        // Browser File System Access API typing is not available in all TS setups.
        const directoryHandle = await win.showDirectoryPicker({ mode: "read" });

        // For security reasons browsers do NOT expose the absolute file system path
        // The returned handle provides the directory name only. This cannot be used
        // directly by the server to read files. We'll pass a placeholder so the user
        // knows which folder they picked, but they must either:
        // 1) Type the absolute folder path into the input, OR
        // 2) Configure LOCAL_MEDIA_ROOTS in .env.local to include the root folder
        //    and then paste the absolute path from their system.
        const folderName = directoryHandle.name;
        const mockPath = `[Selected Folder: ${folderName}]`;
        onFolderSelect(mockPath);
      } else {
        // Fallback for browsers that don't support the API
        setIsSupported(false);
        alert(
          "Your browser doesn't support the folder picker. Please type the folder path manually."
        );
      }
    } catch (error) {
      const e = error as { name?: string } | undefined;
      if (e?.name !== "AbortError") {
        console.error("Error picking folder:", error);
        alert("Error selecting folder. Please try typing the path manually.");
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={currentPath}
        onChange={(e) => onFolderSelect(e.target.value)}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
        placeholder="C:\Users\YourName\Videos\CourseName"
      />

      {isSupported && (
        <button
          type="button"
          onClick={handleFolderPick}
          className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          title="Browse for folder"
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span className="ml-2 hidden sm:block">Browse</span>
        </button>
      )}

      {!isSupported && (
        <div className="text-xs text-gray-500 mt-1">
          Folder picker not supported in this browser
        </div>
      )}
    </div>
  );
}
