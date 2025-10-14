export const metadata = {
  title: "Terms of Service | Where Next",
  description: "Terms of service for Where Next travel planning platform."
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-6">Terms and conditions for using Where Next.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          These terms of service govern your use of Where Next. By using our platform, 
          you agree to these terms and conditions.
        </p>
        <p className="mb-6">
          Please read these terms carefully before using our services. If you have 
          any questions, please contact us.
        </p>
      </div>
      <a href="/support/terms" className="inline-block rounded-md border px-4 py-2">Read full terms</a>
    </main>
  );
}
