export default function Loading() {
  return (
    <div className="flex-1 p-6 max-w-content mx-auto w-full animate-pulse">
      <div className="w-40 h-4 bg-surface-container-high rounded mb-6" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-dim" />
        <div className="flex flex-col gap-2">
          <div className="w-48 h-6 bg-surface-container-high rounded" />
          <div className="w-32 h-3 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/30">
            <div className="w-10 h-10 rounded-full bg-surface-dim" />
            <div className="w-36 h-4 bg-surface-container-high rounded" />
            <div className="ml-auto w-24 h-3 bg-surface-dim rounded" />
            <div className="w-16 h-5 bg-surface-dim rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
