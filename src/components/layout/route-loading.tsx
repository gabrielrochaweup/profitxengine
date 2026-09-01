export default function RouteLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 rounded-input bg-card-hover" />
      <div className="mt-2 h-4 w-96 max-w-full rounded-input bg-card-hover" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-card bg-card shadow-card" />
        ))}
      </div>
    </div>
  );
}
