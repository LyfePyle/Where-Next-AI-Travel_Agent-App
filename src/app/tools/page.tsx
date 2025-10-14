export const metadata = { 
  title: "Travel Tools | Where Next",
  description: "Handy calculators and resources to plan smarter trips."
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Travel Tools</h1>
      <p className="text-sm text-gray-600 mb-6">
        Handy calculators and resources to plan smarter trips.
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        <li className="rounded-xl border p-4">
          <h3 className="font-semibold">Budget Estimator</h3>
          <p className="text-sm text-gray-600 mb-3">Ballpark your total trip cost.</p>
          <a className="rounded-md border px-3 py-2 inline-block" href="/budget">Open</a>
        </li>
        <li className="rounded-xl border p-4">
          <h3 className="font-semibold">Walking Tours</h3>
          <p className="text-sm text-gray-600 mb-3">Self-guided routes with POIs.</p>
          <a className="rounded-md border px-3 py-2 inline-block" href="/tours">Open</a>
        </li>
        <li className="rounded-xl border p-4">
          <h3 className="font-semibold">AI Travel Agent</h3>
          <p className="text-sm text-gray-600 mb-3">Get personalized recommendations.</p>
          <a className="rounded-md border px-3 py-2 inline-block" href="/ai-travel-agent">Open</a>
        </li>
        <li className="rounded-xl border p-4">
          <h3 className="font-semibold">Trip Planner</h3>
          <p className="text-sm text-gray-600 mb-3">Plan your perfect itinerary.</p>
          <a className="rounded-md border px-3 py-2 inline-block" href="/plan-trip">Open</a>
        </li>
      </ul>
    </main>
  );
}
