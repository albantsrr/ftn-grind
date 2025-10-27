export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700"></div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>

        {/* Date */}
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>

        {/* Steps info */}
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-14"></div>
        </div>

        {/* Rating */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          </div>
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div>
      </div>
    </div>
  );
}
