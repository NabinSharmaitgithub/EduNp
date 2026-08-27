export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-surface-dim rounded" />
          <div className="h-4 w-64 bg-surface-dim rounded" />
        </div>
        <div className="h-10 w-32 bg-surface-dim rounded-lg" />
      </div>
      <div className="h-11 max-w-sm bg-surface-dim rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-surface-dim rounded-xl" />
        ))}
      </div>
    </div>
  )
}