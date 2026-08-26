export default function PrincipalPerformanceLoading() {
  return (
    <div className="max-w-content mx-auto w-full space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-surface-container-high rounded" />
          <div className="h-4 w-48 bg-surface-container-high rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-surface-container-high rounded-lg" />
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-56 bg-surface-container-high rounded-lg" />
        <div className="h-10 w-44 bg-surface-container-high rounded-lg" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 h-96" />
    </div>
  )
}
