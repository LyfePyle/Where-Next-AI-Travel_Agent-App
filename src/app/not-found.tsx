import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-10 text-center">
      <h1 className="text-2xl font-bold mb-2">We moved that page</h1>
      <p className="mb-6 text-gray-600">Try one of these:</p>
      <div className="flex gap-3 justify-center">
        <Link className="border rounded px-3 py-2" href="/plan-trip">Plan Trip</Link>
        <Link className="border rounded px-3 py-2" href="/walking-tour">Walking Tours</Link>
        <Link className="border rounded px-3 py-2" href="/budget">Budget</Link>
      </div>
    </main>
  );
}