export default function Loading() {
  return (
    <div className="flex-1 p-6 max-w-content mx-auto w-full animate-pulse">
      <div className="w-56 h-4 bg-surface-container-high rounded mb-6" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-dim" />
        <div className="flex flex-col gap-2">
          <div className="w-48 h-7 bg-surface-container-high rounded" />
          <div className="w-64 h-3 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="h-10 w-72 bg-surface-container-high rounded-lg mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 h-80" />
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 h-80" />
      </div>
    </div>
  );
}
