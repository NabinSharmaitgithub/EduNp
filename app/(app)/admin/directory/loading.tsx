export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-surface-dim rounded" />
        <div className="flex gap-3"><div className="h-10 w-36 bg-surface-dim rounded" /><div className="h-10 w-36 bg-surface-dim rounded" /></div>
        <div className="h-96 bg-surface-dim rounded-xl" />
      </div>
    </div>
  )
}
