export default function HelpingStaffLeaveSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-36 bg-gray-200 rounded-md" />
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
