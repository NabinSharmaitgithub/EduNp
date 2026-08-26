export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-surface-dim rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-surface-dim rounded-xl" />)}
        </div>
        <div className="h-64 bg-surface-dim rounded-xl" />
      </div>
    </div>
  )
}
