"use client";

import { useState, useTransition, useEffect } from "react";
import { getUserCourses, deleteCourse } from "@/actions/courses";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import toast from "react-hot-toast";

interface Course {
  _id: string;
  title: string;
  sourceType: "local" | "google-drive";
  sourcePathOrLink: string;
  totalVideos: number;
  completedVideos: number;
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<
    "all" | "local" | "google-drive"
  >("all");
  const [sortBy, setSortBy] = useState<"progress" | "recent">("progress");
  const [isPending, startTransition] = useTransition();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    courseId: string;
    title: string;
  }>({
    isOpen: false,
    courseId: "",
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    let filtered = [...courses];

    // Filter by source
    if (filterSource !== "all") {
      filtered = filtered.filter(
        (course) => course.sourceType === filterSource
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort courses
    if (sortBy === "progress") {
      filtered.sort((a, b) => {
        const progressA =
          a.totalVideos > 0 ? (a.completedVideos / a.totalVideos) * 100 : 0;
        const progressB =
          b.totalVideos > 0 ? (b.completedVideos / b.totalVideos) * 100 : 0;
        return progressB - progressA; // Highest progress first
      });
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredCourses(filtered);
  }, [courses, filterSource, searchQuery, sortBy]);

  const loadCourses = () => {
    startTransition(async () => {
      const result = await getUserCourses();
      if (Array.isArray(result)) {
        setCourses(result as Course[]);
      }
    });
  };

  const handleDelete = async (courseId: string, title: string) => {
    setDeleteModal({ isOpen: true, courseId, title });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("courseId", deleteModal.courseId);
      await deleteCourse(formData);
      toast.success("Course deleted successfully");
      loadCourses();
      setDeleteModal({ isOpen: false, courseId: "", title: "" });
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  const getProgress = (course: Course) => {
    return course.totalVideos > 0
      ? ((course.completedVideos / course.totalVideos) * 100).toFixed(0)
      : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
              <p className="text-gray-600 mt-1">
                Manage and track your video courses
              </p>
            </div>
            <Link
              href="/create-course"
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
              Create Course
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search courses by name..."
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
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Source Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterSource("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterSource === "all"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All Sources
                </button>
                <button
                  onClick={() => setFilterSource("local")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterSource === "local"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  📁 Local
                </button>
                <button
                  onClick={() => setFilterSource("google-drive")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterSource === "google-drive"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ☁️ Google Drive
                </button>
              </div>

              {/* Sort */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSortBy("progress")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === "progress"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  📊 Highest Progress
                </button>
                <button
                  onClick={() => setSortBy("recent")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === "recent"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🕒 Most Recent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {courses.length}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
                  {
                    courses.filter(
                      (c) =>
                        c.completedVideos === c.totalVideos && c.totalVideos > 0
                    ).length
                  }
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
                <p className="text-sm text-gray-600">Local Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {courses.filter((c) => c.sourceType === "local").length}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Google Drive</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {
                    courses.filter((c) => c.sourceType === "google-drive")
                      .length
                  }
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-2xl">☁️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No courses found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterSource !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating a course"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const progress = getProgress(course);
              return (
                <div
                  key={course._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <Link href={`/course/${course._id}`} className="block">
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
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                          {course.sourceType === "local"
                            ? "📁 Local"
                            : "☁️ Drive"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          {course.completedVideos} of {course.totalVideos}{" "}
                          videos completed
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {progress}% complete
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <Link
                      href={`/course/${course._id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Continue Learning →
                    </Link>
                    <button
                      onClick={() => handleDelete(course._id, course.title)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete course"
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
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModal.title}"? This will also delete all associated videos. This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, courseId: "", title: "" })
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
