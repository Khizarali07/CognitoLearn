"use client";

import { useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await requestPasswordReset(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success(result.success);
        }
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
          return;
        }
        toast.error(
          error instanceof Error ? error.message : "An error occurred"
        );
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot password?
            </h2>
            <p className="text-gray-600">
              No worries, we&apos;ll send you reset instructions
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isPending ? (
                <span className="flex items-center justify-center">
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3 text-center">
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              ← Back to login
            </Link>
            <Link
              href="/signup"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Don&apos;t have an account?{" "}
              <span className="font-medium text-indigo-600">Sign up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
