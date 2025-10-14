export const metadata = {
  title: "Careers | Where Next",
  description: "Join our team and help build the future of travel planning."
};

export default function CareersPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-2">Careers at Where Next</h1>
      <p className="text-sm text-gray-500 mb-6">Join our team and help build the future of travel planning.</p>
      <div className="prose prose-sm">
        <p className="mb-4">
          We're looking for passionate individuals who want to revolutionize how people 
          plan and experience travel. From AI engineers to travel experts, we're building 
          a diverse team.
        </p>
        <p className="mb-6">
          Currently, we're not actively hiring, but we'd love to hear from you. 
          Send us your resume and we'll keep you in mind for future opportunities.
        </p>
      </div>
      <a href="/support/contact" className="inline-block rounded-md border px-4 py-2">Get in touch</a>
    </main>
  );
}
