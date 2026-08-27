export default function HelpingStaffTimetableSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
      <div className="space-y-6">
        {[1,2,3].map(i => (
          <div key={i}>
            <div className="h-6 w-24 bg-gray-200 rounded mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1,2].map(j => <div key={j} className="h-24 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
