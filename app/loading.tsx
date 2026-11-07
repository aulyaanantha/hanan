import AppShell from "@/components/AppShell";

export default function Loading() {
  return <AppShell><div className="route-loading mx-auto max-w-6xl" role="status" aria-label="Loading page" aria-busy="true">
    <div className="route-loading-title" aria-hidden="true" />
    <div className="route-loading-subtitle" aria-hidden="true" />
    <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map(index => <div key={index} className="soft-card route-loading-card rounded-3xl p-5"><div /><div /></div>)}
    </div>
    <div className="soft-card route-loading-panel mt-6 rounded-3xl p-6" aria-hidden="true"><div /><div /><div /></div>
    <span className="sr-only">Loading your latest data...</span>
  </div></AppShell>;
}
