"use client";

interface FolderPickerProps {
  onFolderSelect: (path: string) => void;
  currentPath: string;
}

export default function FolderPicker({
  onFolderSelect,
  currentPath,
}: FolderPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          value={currentPath}
          onChange={(e) => onFolderSelect(e.target.value)}
          className="flex-1 w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
          placeholder="C:\Users\YourName\Videos\CourseName"
        />
      </div>
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="font-medium mb-1">
          ⚠️ Important: Enter the complete folder path
        </p>
        <p className="text-amber-700">
          Due to browser security restrictions, you must manually type or paste
          the full absolute path. Example:{" "}
          <code className="bg-amber-100 px-1 rounded">
            C:\Users\PC\Desktop\videos\Course-folder
          </code>
        </p>
      </div>
    </div>
  );
}
