export const metadata = {
  title: "Contact Us | Where Next",
  description: "Get in touch with the Where Next team."
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-sm text-gray-500 mb-6">Get in touch with the Where Next team.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          Have questions, feedback, or suggestions? We'd love to hear from you. 
          Send us a message and we'll get back to you as soon as possible.
        </p>
        <p className="mb-6">
          For support issues, please visit our help center first for faster assistance.
        </p>
      </div>
      <a href="/support/contact" className="inline-block rounded-md border px-4 py-2">Send message</a>
    </main>
  );
}
