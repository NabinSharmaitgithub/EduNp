export default function HelpingStaffAnnouncementsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
