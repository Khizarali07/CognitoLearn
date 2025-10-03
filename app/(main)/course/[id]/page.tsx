"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VideoSidebar from "@/components/VideoSidebar";
import { getCourseWithVideos, markVideoCompleted } from "@/actions/courses";
import { signOut } from "@/actions/auth";

interface Video {
  _id: string;
  title: string;
  videoUrl: string;
  isCompleted: boolean;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  sourceType: "local" | "google-drive";
  totalVideos: number;
  completedVideos: number;
  videos: Video[];
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const courseData = await getCourseWithVideos(params.id);
        setCourse(courseData);

        // Set first uncompleted video as current, or first video if all completed
        if (courseData.videos && courseData.videos.length > 0) {
          const firstUncompleted = courseData.videos.find(
            (v) => !v.isCompleted
          );
          setCurrentVideo(firstUncompleted || courseData.videos[0]);
        }
      } catch {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [params.id]);

  const handleVideoSelect = (video: Video) => {
    setCurrentVideo(video);
  };

  const handleMarkComplete = async () => {
    if (!currentVideo || !course) return;

    setMarkingComplete(true);
    try {
      await markVideoCompleted(currentVideo._id, course._id);

      // Update local state
      setCourse((prev) => {
        if (!prev) return prev;

        const updatedVideos = prev.videos.map((v) =>
          v._id === currentVideo._id ? { ...v, isCompleted: true } : v
        );

        const newCompletedCount = updatedVideos.filter(
          (v) => v.isCompleted
        ).length;

        return {
          ...prev,
          videos: updatedVideos,
          completedVideos: newCompletedCount,
        };
      });

      setCurrentVideo((prev) => (prev ? { ...prev, isCompleted: true } : null));
    } catch {
      alert("Failed to mark video as complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Course not found
          </h3>
          <p className="text-gray-600 mb-6">
            {error || "The course you're looking for doesn't exist."}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* Burger Menu for Mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                  {course.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {course.completedVideos}/{course.totalVideos} videos completed
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <span
                className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  course.sourceType === "google-drive"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {course.sourceType === "google-drive"
                  ? "Google Drive"
                  : "Local Files"}
              </span>

              <form action={signOut} className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg
                    className="sm:mr-1 w-3 h-3"
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
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Video Sidebar */}
        <VideoSidebar
          videos={course.videos}
          currentVideoId={currentVideo?._id || null}
          onVideoSelect={handleVideoSelect}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Video Player Area */}
        <div className="flex-1 flex flex-col">
          {currentVideo ? (
            <>
              {/* Video Player */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-4">
                {course.sourceType === "google-drive" ? (
                  <iframe
                    src={
                      currentVideo.videoUrl.includes("/preview")
                        ? currentVideo.videoUrl
                        : currentVideo.videoUrl.includes("/file/d/")
                        ? currentVideo.videoUrl + "/preview"
                        : currentVideo.videoUrl
                    }
                    className="w-full h-full max-w-6xl rounded-lg"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                    title={currentVideo.title || "Google Drive video"}
                  />
                ) : (
                  <div className="w-full h-full max-w-6xl bg-black rounded-lg flex items-center justify-center">
                    <video
                      key={currentVideo._id}
                      controls
                      controlsList="nodownload"
                      className="w-full h-full rounded-lg"
                    >
                      <source
                        src={`/api/local-media?path=${encodeURIComponent(
                          currentVideo.videoUrl
                        )}`}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 truncate">
                        {currentVideo.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span>
                          Video {currentVideo.order + 1} of {course.totalVideos}
                        </span>
                        {currentVideo.isCompleted && (
                          <span className="inline-flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      {!currentVideo.isCompleted && (
                        <button
                          onClick={handleMarkComplete}
                          disabled={markingComplete}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {markingComplete ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                              Marking...
                            </>
                          ) : (
                            <>
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Mark as Complete
                            </>
                          )}
                        </button>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const currentIndex = course.videos.findIndex(
                              (v) => v._id === currentVideo._id
                            );
                            if (currentIndex > 0) {
                              setCurrentVideo(course.videos[currentIndex - 1]);
                            }
                          }}
                          disabled={
                            course.videos.findIndex(
                              (v) => v._id === currentVideo._id
                            ) === 0
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </button>

                        <button
                          onClick={() => {
                            const currentIndex = course.videos.findIndex(
                              (v) => v._id === currentVideo._id
                            );
                            if (currentIndex < course.videos.length - 1) {
                              setCurrentVideo(course.videos[currentIndex + 1]);
                            }
                          }}
                          disabled={
                            course.videos.findIndex(
                              (v) => v._id === currentVideo._id
                            ) ===
                            course.videos.length - 1
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Video Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a video to start
                </h3>
                <p className="text-gray-600">
                  Choose a video from the sidebar to begin watching your course.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
