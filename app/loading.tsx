export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{
          borderColor: "oklch(0.28 0.02 30)",
          borderTopColor: "oklch(0.62 0.22 38)",
        }}
      />
    </div>
  );
}
