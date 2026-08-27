export default function TeacherClassesSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
