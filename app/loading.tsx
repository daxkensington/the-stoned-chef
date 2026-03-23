export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Hero skeleton */}
      <div className="skeleton" style={{ height: "85vh", borderRadius: 0 }} />

      {/* Food strip skeleton */}
      <div className="container py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "4/3" }} />
          ))}
        </div>
      </div>

      {/* Menu skeleton */}
      <div className="container py-10">
        <div className="skeleton mb-6" style={{ height: 48, width: 200 }} />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 40, width: 100 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 280 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
