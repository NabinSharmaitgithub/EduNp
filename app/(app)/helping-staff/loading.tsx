export default function HelpingStaffDashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-24 bg-gray-200 rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[1,2].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
