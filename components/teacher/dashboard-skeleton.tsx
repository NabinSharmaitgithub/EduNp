export default function TeacherDashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-3 mb-8">
        {[1,2].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  )
}
