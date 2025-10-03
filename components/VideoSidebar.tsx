"use client";

interface VideoSidebarProps {
  videos: Array<{
    _id: string;
    title: string;
    videoUrl: string;
    isCompleted: boolean;
    order: number;
  }>;
  currentVideoId: string | null;
  onVideoSelect: (video: {
    _id: string;
    title: string;
    videoUrl: string;
    isCompleted: boolean;
    order: number;
  }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function VideoSidebar({
  videos,
  currentVideoId,
  onVideoSelect,
  isOpen = true,
  onClose,
}: VideoSidebarProps) {
  const handleVideoClick = (video: (typeof videos)[0]) => {
    onVideoSelect(video);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close sidebar"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Course Videos
          </h2>
          <div className="text-center text-gray-500 py-8">
            <svg
              className="mx-auto w-12 h-12 text-gray-400 mb-4"
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
            <p>No videos found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {onClose && (
          <div className="lg:hidden sticky top-0 bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Course Videos ({videos.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 hidden lg:block">
            Course Videos ({videos.length})
          </h2>
          <div className="space-y-2">
            {videos.map((video, index) => {
              const isActive = currentVideoId === video._id;
              const isCompleted = video.isCompleted;
              return (
                <button
                  key={video._id}
                  onClick={() => handleVideoClick(video)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
                      : "bg-white border-2 border-transparent hover:bg-gray-100 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium leading-5 break-words ${
                          isCompleted
                            ? "text-green-700 line-through decoration-green-500/50"
                            : isActive
                            ? "text-blue-900"
                            : "text-gray-900 group-hover:text-gray-700"
                        }`}
                      >
                        {video.title || `Video ${index + 1}`}
                      </h3>
                      <div className="mt-1 flex items-center space-x-2">
                        {isCompleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                        {isActive && !isCompleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Playing
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex-shrink-0 ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {videos.filter((v) => v.isCompleted).length}/{videos.length}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    videos.length > 0
                      ? (videos.filter((v) => v.isCompleted).length /
                          videos.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
