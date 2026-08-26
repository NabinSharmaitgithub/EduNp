export default function PrincipalLoading() {
  return (
    <div className="max-w-content mx-auto w-full space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-surface-container-high rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 h-24" />
        ))}
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 h-48" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 h-64" />
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 h-64" />
      </div>
    </div>
  )
}
