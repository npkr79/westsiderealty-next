export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="pt-20 pb-32 min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-16 bg-white/10 rounded-2xl mb-4 animate-pulse" />
          <div className="h-12 bg-white/10 rounded-2xl mb-8 animate-pulse" />
          <div className="h-32 bg-white/10 rounded-3xl animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-80 h-64 bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
