import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import jobsData from '@/data/marketing/jobs.sample.json';
import { 
  MapPin, 
  Clock, 
  Users, 
  Heart,
  Plane,
  Wifi,
  GraduationCap,
  Coffee
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Careers | Where Next",
  description: "Remote-first, product-obsessed, traveler-friendly.",
};

const benefits = [
  {
    title: "Remote Stipend",
    body: "$2,000/year for home office setup, coworking spaces, or wherever you work best.",
    icon: <Wifi className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Learning Budget", 
    body: "$1,500/year for courses, conferences, books, or certifications to grow your skills.",
    icon: <GraduationCap className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Flexible PTO",
    body: "Unlimited time off policy because we trust you to manage your work and rest balance.",
    icon: <Clock className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Team Trips",
    body: "Annual company retreat plus travel stipend to meet teammates around the world.",
    icon: <Plane className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Health & Wellness",
    body: "Premium health insurance, mental health support, and wellness stipend for gym or activities.",
    icon: <Heart className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Coffee Budget",
    body: "$50/month coffee allowance because great ideas happen over great coffee.",
    icon: <Coffee className="w-6 h-6 text-blue-600" />
  }
];

export default function CareersPage() {
  return (
    <>
      <Hero
        title="Build tools millions will carry in their pocket."
        subtitle="Remote-first, product-obsessed, traveler-friendly."
        cta={{ label: "View Open Roles", href: "#jobs" }}
        secondaryCta={{ label: "Meet the Team", href: "/company/about#team" }}
      />

      {/* Culture */}
      <Section title="Our Culture" subtitle="What it's like to work at Where Next">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Built for Travelers, by Travelers
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>
                Our team is distributed across 15 countries and 12 time zones. We practice what we preach about remote work and understand the unique challenges of building while traveling.
              </p>
              <p>
                We believe the best products come from diverse perspectives, so we hire amazing people regardless of where they're located.
              </p>
              <p>
                Our values guide everything: ship fast but thoughtfully, support each other, and always put the user first.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
            <div className="space-y-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <div className="font-bold text-gray-900">25 Team Members</div>
                  <div className="text-sm text-gray-600">Across 15 countries</div>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <div className="font-bold text-gray-900">100% Remote</div>
                  <div className="text-sm text-gray-600">Since day one</div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-600 mr-4" />
                <div>
                  <div className="font-bold text-gray-900">Async-First</div>
                  <div className="text-sm text-gray-600">Documentation over meetings</div>
                </div>
              </div>
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-red-600 mr-4" />
                <div>
                  <div className="font-bold text-gray-900">Work-Life Balance</div>
                  <div className="text-sm text-gray-600">Unlimited PTO policy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Benefits */}
      <Section title="Benefits & Perks" subtitle="We invest in our team's success and happiness">
        <CardGrid items={benefits} cols={{ base: 1, md: 2, lg: 3 }} />
      </Section>

      {/* Hiring Process */}
      <Section title="Our Hiring Process" subtitle="Transparent, respectful, and efficient">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Application</h3>
            <p className="text-gray-600 text-sm">Submit your application with portfolio/GitHub. We review every application personally.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Screening</h3>
            <p className="text-gray-600 text-sm">30-minute video call to chat about your experience and answer questions about the role.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Technical</h3>
            <p className="text-gray-600 text-sm">Take-home project or pair programming session (your choice). We respect your time.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-orange-600">4</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Team Chat</h3>
            <p className="text-gray-600 text-sm">Meet potential teammates and ask about day-to-day work. Cultural fit goes both ways.</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            <strong>Timeline:</strong> We aim to complete the entire process within 2 weeks and provide feedback at every stage.
          </p>
        </div>
      </Section>

      {/* Open Roles */}
      <Section id="jobs" title="Open Roles" subtitle="Find your next adventure">
        <div className="space-y-6">
          {jobsData.map((job) => (
            <div
              key={job.id}
              className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className="ml-3 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {job.type}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {job.description}
                  </p>
                </div>
                <div className="md:ml-6 flex-shrink-0">
                  <a
                    href={job.applyUrl}
                    className="tap-lg w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Don't see a perfect fit?
            </h3>
            <p className="text-gray-600 mb-6">
              We're always looking for exceptional people. Send us your resume and tell us how you'd like to contribute.
            </p>
            <a
              href="mailto:careers@wherenext.com?subject=General Application"
              className="tap-lg inline-flex items-center px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Send General Application
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
