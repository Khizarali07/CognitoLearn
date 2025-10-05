import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { getUserCourses } from "@/actions/courses";
import { getUserBooks } from "@/actions/bookActions";

export default async function DashboardPage() {
  const courses = await getUserCourses();
  const booksResult = await getUserBooks();
  const books = booksResult.success ? booksResult.books : [];

  const courseStats = {
    total: courses.length,
    completed: courses.filter(
      (c) => c.completedVideos === c.totalVideos && c.totalVideos > 0
    ).length,
    inProgress: courses.filter(
      (c) => c.completedVideos > 0 && c.completedVideos < c.totalVideos
    ).length,
  };

  const bookStats = {
    total: books.length,
    completed: 0, // We don't track completion status yet
    inProgress: books.length, // All books are considered in progress
  };

  const topCourses = [...courses]
    .sort((a, b) => {
      const progressA =
        a.totalVideos > 0 ? a.completedVideos / a.totalVideos : 0;
      const progressB =
        b.totalVideos > 0 ? b.completedVideos / b.totalVideos : 0;
      return progressB - progressA;
    })
    .slice(0, 3);

  const topBooks = books.slice(0, 3); // Just get the first 3 books
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome back! Here&apos;s your learning progress
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
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
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {courseStats.total}
                </p>
                <p className="text-sm text-gray-600">Total Courses</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span className="text-green-600 font-medium">
                    {courseStats.completed} completed
                  </span>
                  <span className="mx-2"></span>
                  <span>{courseStats.inProgress} in progress</span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                <p className="text-3xl font-bold text-gray-900">
                  {bookStats.total}
                </p>
                <p className="text-sm text-gray-600">Total Books</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span className="text-green-600 font-medium">
                    {bookStats.completed} completed
                  </span>
                  <span className="mx-2"></span>
                  <span>{bookStats.inProgress} in progress</span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
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
                <p className="text-3xl font-bold text-gray-900">
                  {courseStats.completed + bookStats.completed}
                </p>
                <p className="text-sm text-gray-600">Total Completed</p>
                <div className="mt-2 text-xs text-gray-500">
                  All finished courses & books
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {courseStats.inProgress + bookStats.inProgress}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
                <div className="mt-2 text-xs text-gray-500">
                  Active learning materials
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Top Courses by Progress
                </h2>
                <Link
                  href="/courses"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All{" "}
                </Link>
              </div>
              {topCourses.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                  <p className="text-gray-600 mb-4">No courses yet</p>
                  <Link
                    href="/create-course"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topCourses.map((course) => {
                    const progress =
                      course.totalVideos > 0
                        ? (
                            (course.completedVideos / course.totalVideos) *
                            100
                          ).toFixed(0)
                        : 0;
                    return (
                      <Link
                        key={course._id}
                        href={`/course/${course._id}`}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 group"
                      >
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
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {progress}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {course.completedVideos} of {course.totalVideos}{" "}
                          videos
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Top Books by Progress
                </h2>
                <Link
                  href="/books"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All{" "}
                </Link>
              </div>
              {topBooks.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                  <p className="text-gray-600 mb-4">No books yet</p>
                  <Link
                    href="/books"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
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
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={`/book/${book.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-3">
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
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Page {book.currentPage}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Last read: Page {book.currentPage}
                      </p>
                      <div className="text-xs text-gray-500">
                        Added {new Date(book.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
