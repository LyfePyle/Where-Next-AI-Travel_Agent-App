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
          Where Next is revolutionizing travel planning with AI-powered recommendations, 
          real-time pricing, and personalized itineraries. Our mission is to make travel 
          planning effortless and accessible to everyone.
        </p>
        <p className="mb-6">
          Founded in 2024, we're combining cutting-edge AI technology with deep travel 
          expertise to create the most intelligent travel planning platform available.
        </p>
      </div>
      <a href="/plan-trip" className="inline-block rounded-md border px-4 py-2">Plan a trip</a>
    </main>
  );
}
