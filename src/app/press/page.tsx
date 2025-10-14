export const metadata = {
  title: "Press Kit | Where Next",
  description: "Media resources and press information for Where Next."
};

export default function PressPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Press Kit</h1>
      <p className="text-sm text-gray-500 mb-6">Media resources and press information for Where Next.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          For media inquiries, press releases, and brand assets, please contact our 
          press team. We're happy to provide interviews, quotes, and additional 
          information about Where Next.
        </p>
        <p className="mb-6">
          Download our press kit for logos, screenshots, and company information.
        </p>
      </div>
      <a href="/support/contact" className="inline-block rounded-md border px-4 py-2">Contact press team</a>
    </main>
  );
}
