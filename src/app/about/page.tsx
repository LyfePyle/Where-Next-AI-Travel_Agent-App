export const metadata = {
  title: "About Us | Where Next",
  description: "Learn about Where Next and our mission to revolutionize travel planning with AI."
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">About Where Next</h1>
      <p className="text-sm text-gray-500 mb-6">We're building an AI-first travel planner.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          Where Next is an AI-powered travel planner for building itineraries, tracking budgets,
          and linking out to trusted booking partners. We help you plan — partners handle the booking.
        </p>
        <p className="mb-6">
          Built solo and pre-launch in 2024, focused on honest affiliate-first travel planning
          without overpromising features that aren&apos;t live yet.
        </p>
      </div>
      <a href="/plan-trip" className="inline-block rounded-md border px-4 py-2">Plan a trip</a>
    </main>
  );
}
