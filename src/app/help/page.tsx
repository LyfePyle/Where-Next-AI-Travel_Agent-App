export const metadata = {
  title: "Help Center | Where Next",
  description: "Get help and support for Where Next travel planning platform."
};

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-gray-500 mb-6">Get help and support for Where Next.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          Need help getting started? Check out our frequently asked questions 
          and step-by-step guides to make the most of Where Next.
        </p>
        <p className="mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
      </div>
      <a href="/support" className="inline-block rounded-md border px-4 py-2">Visit support</a>
    </main>
  );
}
