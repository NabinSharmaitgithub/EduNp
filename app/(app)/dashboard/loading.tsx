export default function Loading() {
  return (
    <div className="flex-1 p-6 max-w-content mx-auto w-full animate-pulse">
      <div className="h-16 -m-6 mb-6 p-6 border-b border-outline-variant/30 flex items-end">
        <div className="w-40 h-8 bg-surface-container-high rounded" />
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/50 shadow-bloom">
            <div className="w-24 h-3 bg-surface-container-high rounded mb-4" />
            <div className="w-16 h-9 bg-surface-dim rounded" />
          </div>
        ))}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-dim" />
              <div className="flex flex-col gap-2">
                <div className="w-28 h-4 bg-surface-container-high rounded" />
                <div className="w-16 h-3 bg-surface-container-high rounded" />
              </div>
            </div>
            <div className="border-t border-outline-variant/30 pt-4 flex justify-between">
              <div className="w-10 h-6 bg-surface-dim rounded" />
              <div className="w-20 h-5 bg-surface-dim rounded" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
