export default function PrincipalStaffLoading() {
  return (
    <div className="max-w-content mx-auto w-full space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-surface-container-high rounded" />
        <div className="h-10 w-28 bg-surface-container-high rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-44 bg-surface-container-high rounded-lg" />
        <div className="h-10 w-40 bg-surface-container-high rounded-lg" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 h-96" />
    </div>
  )
}
