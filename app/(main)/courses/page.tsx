"use client";

import { useState, useTransition, useEffect } from "react";
import { getUserCourses, deleteCourse, updateCourse } from "@/actions/courses";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditModal from "@/components/EditModal";
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
  const [sortBy] = useState<"progress" | "recent">("progress");
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
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    courseId: string;
    title: string;
  }>({ isOpen: false, courseId: "", title: "" });
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                     <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">All Courses</h1>
                     <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Manage and track your video courses</p>
                </div>
                <Link
                    href="/create-course"
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Course
                </Link>
            </div>

             {/* Stats */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                 <StatCard 
                    title="Total Courses" 
                    value={courses.length} 
                    icon={<svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                 <StatCard 
                    title="Completed" 
                    value={courses.filter(c => c.completedVideos === c.totalVideos && c.totalVideos > 0).length} 
                    icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                 <StatCard 
                    title="Local Courses" 
                    value={courses.filter(c => c.sourceType === "local").length} 
                    icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                 <StatCard 
                    title="Drive Courses" 
                    value={courses.filter(c => c.sourceType === "google-drive").length} 
                    icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
                />
             </div>

             {/* Filters */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                 <div className="relative w-full md:max-w-md">
                     <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                     />
                 </div>
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                     <FilterButton active={filterSource === "all"} onClick={() => setFilterSource("all")} label="All Sources" />
                     <FilterButton active={filterSource === "local"} onClick={() => setFilterSource("local")} label="Local" icon={<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                     <FilterButton active={filterSource === "google-drive"} onClick={() => setFilterSource("google-drive")} label="Drive" icon={<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>} />
                 </div>
             </div>

             {/* Grid */}
             {isPending ? (
                 <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
             ) : filteredCourses.length === 0 ? (
                 <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                     <svg className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                     <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">No courses found matching your criteria</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredCourses.map(course => {
                        const progress = getProgress(course);
                        return (
                            <div key={course._id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col overflow-hidden">
                                <Link href={`/course/${course._id}`} className="block p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="flex gap-2">
                                             <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                {course.sourceType === 'local' ? 'Local' : 'Drive'}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                        {course.completedVideos} of {course.totalVideos} videos completed
                                    </p>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="mt-2 text-right">
                                         <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                                    </div>
                                </Link>
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <Link href={`/course/${course._id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        Continue Learning &rarr;
                                    </Link>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => setEditModal({ isOpen: true, courseId: course._id, title: course.title })} 
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Edit Course"
                                        >
                                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(course._id, course.title)}  
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Course"
                                        >
                                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
             )}

        </div>
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

      {/* Edit Modal */}
      <EditModal
        isOpen={editModal.isOpen}
        title="Edit Course"
        initialTitle={editModal.title}
        onClose={() => setEditModal({ isOpen: false, courseId: "", title: "" })}
        onSave={async (newTitle) => {
            const result = await updateCourse(editModal.courseId, newTitle);
            if (result.success) {
                // Optimistic update
                setCourses(prev => prev.map(c => c._id === editModal.courseId ? { ...c, title: newTitle } : c));
            } else {
                throw new Error(result.error);
            }
        }}
      />
    </div>
  );
}

// Sub-components
function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    {icon}
                </div>
            </div>
             <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
        </div>
    )
}

function FilterButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            {label}
        </button>
    )
}
