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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar />
      <main className="flex-1 lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Your personal learning hub. Track progress and jump back in.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
               title="Total Courses" 
               value={courseStats.total} 
               subtitle={`${courseStats.completed} completed`}
               icon={<svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <StatCard 
               title="Total Books" 
               value={bookStats.total} 
               subtitle={`${bookStats.inProgress} reading`}
               icon={<svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />
            <StatCard 
               title="Completed" 
               value={courseStats.completed + bookStats.completed} 
               subtitle="Modules finished"
               icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
             <StatCard 
               title="In Progress" 
               value={courseStats.inProgress + bookStats.inProgress} 
               subtitle="Active items"
               icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
          </div>

          {/* Top Courses Section */}
          <SectionHeader title="Jump Back In (Courses)" linkHref="/courses" />
          {topCourses.length === 0 ? (
            <EmptyState 
              message="No courses started yet" 
              actionLink="/create-course" 
              actionText="Create Course" 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {topCourses.map((course) => (
                 <CourseCard key={course._id} course={course as any} />
               ))}
            </div>
          )}

          {/* Top Books Section */}
          <SectionHeader title="Continue Reading (Books)" linkHref="/books" />
           {topBooks.length === 0 ? (
            <EmptyState 
              message="No books uploaded yet" 
              actionLink="/books" 
              actionText="Upload Book" 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {topBooks.map((book) => (
                 <BookCard key={book.id} book={book} />
               ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, subtitle, icon }: any) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    {icon}
                </div>
            </div>
            <div>
                 <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtitle}</p>
            </div>
        </div>
    )
}

function SectionHeader({ title, linkHref }: any) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <Link href={linkHref} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                View All &rarr;
            </Link>
        </div>
    )
}

function EmptyState({ message, actionLink, actionText }: any) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
             <p className="text-slate-500 dark:text-slate-400 mb-4 font-medium">{message}</p>
             <Link href={actionLink} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
                {actionText}
             </Link>
        </div>
    )
}

function CourseCard({ course }: { course: any }) {
    const progress = course.totalVideos > 0 ? ((course.completedVideos / course.totalVideos) * 100).toFixed(0) : 0;
    return (
        <Link href={`/course/${course._id}`} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                    {progress}%
                </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                {course.title}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {course.completedVideos} / {course.totalVideos} videos
            </p>
        </Link>
    )
}

function BookCard({ book }: { book: any }) {
    return (
        <Link href={`/book/${book.id}`} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl hover:border-purple-100 dark:hover:border-purple-900 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                 <span className="text-xs font-bold px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-md">
                   Pg {book.currentPage}
                </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                {book.title}
            </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
                Added {new Date(book.createdAt).toLocaleDateString()}
            </p>
        </Link>
    )
}
