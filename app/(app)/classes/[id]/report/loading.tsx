export default function Loading() {
  return (
    <div className="flex-1 p-6 max-w-content mx-auto w-full animate-pulse">
      <div className="w-56 h-4 bg-surface-container-high rounded mb-6" />
      <div className="flex justify-between mb-6">
        <div className="w-64 h-8 bg-surface-container-high rounded" />
        <div className="w-48 h-10 bg-surface-dim rounded-md" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/30">
            <div className="w-8 h-6 bg-surface-dim rounded" />
            <div className="w-40 h-4 bg-surface-container-high rounded" />
            <div className="ml-auto w-32 h-2 bg-surface-dim rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
