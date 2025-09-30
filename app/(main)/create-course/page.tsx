"use client";

import { useState } from "react";
import Link from "next/link";
import { createCourse } from "@/actions/courses";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import FolderPicker from "@/components/FolderPicker";

export default function CreateCoursePage() {
  const [sourceType, setSourceType] = useState<"local" | "google-drive">(
    "local"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [driveLink, setDriveLink] = useState("");

  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      // Set the correct source path based on source type
      const pathValue = sourceType === "local" ? folderPath : driveLink;
      formData.set("sourcePathOrLink", pathValue);

      const result = await createCourse(formData);
      if (result && result.courseId) {
        // Navigate on the client to avoid NEXT_REDIRECT server action bubbling
        router.push(`/course/${result.courseId}`);
      } else {
        throw new Error("Course creation did not return an id");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error creating course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Course
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Set up your video course from local files or Google Drive
                </p>
              </div>
            </div>

            <form action={signOut} className="inline">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg
                  className="mr-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-8 py-6">
            <form action={handleSubmit} className="space-y-8">
              {/* Course Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Course Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                  placeholder="Enter your course title"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Choose a descriptive title for your course
                </p>
              </div>

              {/* Source Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Video Source *
                </label>

                <input type="hidden" name="sourceType" value={sourceType} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Local Folder Option */}
                  <div
                    className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      sourceType === "local"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSourceType("local")}
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="source-type"
                          value="local"
                          checked={sourceType === "local"}
                          onChange={() => setSourceType("local")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-5 h-5 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h10a2 2 0 012 2v0a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                              />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900">
                              Local Folder
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Import videos from a folder on your computer
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Drive Option */}
                  <div
                    className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      sourceType === "google-drive"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSourceType("google-drive")}
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="source-type"
                          value="google-drive"
                          checked={sourceType === "google-drive"}
                          onChange={() => setSourceType("google-drive")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6.28 3l5.24 9.07L15.76 3h4.95L12 21 1.29 3H6.28zm7.43 9.93L11.83 15l1.88-2.07h2.92l-2.92-2.93z" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900">
                              Google Drive
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Import videos from a Google Drive folder
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Path/Link Input */}
              <div>
                {sourceType === "local" ? (
                  <>
                    <label
                      htmlFor="sourcePathOrLink"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Local Folder Path *
                    </label>
                    <FolderPicker
                      currentPath={folderPath}
                      onFolderSelect={setFolderPath}
                    />
                    <input
                      type="hidden"
                      name="sourcePathOrLink"
                      value={folderPath}
                      required
                    />
                    <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Local File Limitation
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Local video files can only be played on this
                              device. The path will be saved but videos
                              won&apos;t be accessible from other devices or
                              when the path changes. This is used in windows
                              only.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label
                      htmlFor="sourcePathOrLink"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Google Drive Folder Link *
                    </label>
                    <input
                      type="url"
                      id="sourcePathOrLink"
                      name="sourcePathOrLink"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="https://drive.google.com/drive/folders/your-folder-id"
                    />
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            How to get the folder link
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              1. Go to Google Drive and open your folder
                              <br />
                              2. Click &quot;Share&quot; and set sharing to
                              &quot;Anyone with the link&quot;
                              <br />
                              3. Copy and paste the folder URL here
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {sourceType === "local"
                    ? "Enter the absolute path to your video folder"
                    : "Paste the shareable Google Drive folder link"}
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 w-5 h-5"
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
                      Create Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
