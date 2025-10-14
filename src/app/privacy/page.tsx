export const metadata = {
  title: "Privacy Policy | Where Next",
  description: "Privacy policy for Where Next travel planning platform."
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-6">How we protect and use your personal information.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          Your privacy is important to us. This privacy policy explains how we collect, 
          use, and protect your personal information when you use Where Next.
        </p>
        <p className="mb-6">
          We are committed to protecting your privacy and ensuring the security of 
          your personal data in accordance with applicable privacy laws.
        </p>
      </div>
      <a href="/support/privacy-policy" className="inline-block rounded-md border px-4 py-2">Read full policy</a>
    </main>
  );
}
