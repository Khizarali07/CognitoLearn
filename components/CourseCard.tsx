"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCourse } from "@/actions/courses";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    totalVideos: number;
    completedVideos: number;
    sourceType: "local" | "google-drive";
    createdAt: Date;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const [deleting, setDeleting] = useState(false);
  const progressPercentage =
    course.totalVideos > 0
      ? Math.round((course.completedVideos / course.totalVideos) * 100)
      : 0;

  const isCompleted =
    course.completedVideos === course.totalVideos && course.totalVideos > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
          {course.title}
        </h3>
        <div className="ml-3 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              course.sourceType === "google-drive"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {course.sourceType === "google-drive" ? "Drive" : "Local"}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span
            className={`font-medium ${
              isCompleted ? "text-green-600" : "text-gray-900"
            }`}
          >
            {course.completedVideos}/{course.totalVideos} videos
            {isCompleted && " ✓"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progressPercentage}% complete
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Created {new Date(course.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/course/${course._id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            aria-label={`Open ${course.title}`}
          >
            {course.completedVideos > 0 ? "Continue" : "Start"}
            <svg
              className="ml-2 w-4 h-4"
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
          </Link>

          {/* Delete button uses a client-side confirmation then submits a server action via fetch to keep UI snappy */}
          <form
            action={deleteCourse}
            className="inline"
            onSubmit={(e) => {
              const confirmed = confirm(
                "Are you sure you want to delete this course? This action cannot be undone."
              );
              if (!confirmed) {
                e.preventDefault();
                return;
              }
              setDeleting(true);
            }}
          >
            <input type="hidden" name="courseId" value={course._id} />

            <button
              type="submit"
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              aria-label={`Delete ${course.title}`}
            >
              {deleting ? (
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
                  Deleting...
                </>
              ) : (
                <>
                  Delete
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
