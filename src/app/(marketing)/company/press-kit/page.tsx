import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import { 
  Download, 
  FileText, 
  Image, 
  Users,
  Mail,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Press Kit | Where Next",
  description: "Logos, screenshots, and a one-page overview.",
};

const factSheet = [
  { label: "Founded", value: "2023" },
  { label: "Headquarters", value: "Remote-first (San Francisco, CA)" },
  { label: "Active Users", value: "50,000+" },
  { label: "Trips Planned", value: "150,000+" },
  { label: "Countries Served", value: "195" },
  { label: "Team Size", value: "25 people across 15 countries" },
  { label: "Funding", value: "Seed round (details available on request)" }
];

const founders = [
  {
    name: "Sarah Chen",
    title: "Co-Founder & CEO",
    bio: "Former product lead at Airbnb with 8+ years in travel tech. Stanford CS graduate. Passionate about making travel accessible to everyone.",
    contact: "sarah@wherenext.com"
  },
  {
    name: "Marcus Rodriguez", 
    title: "Co-Founder & CTO",
    bio: "Ex-Google engineer specializing in AI and travel APIs. MIT graduate. Digital nomad for 5+ years across 40+ countries.",
    contact: "marcus@wherenext.com"
  }
];

export default function PressKitPage() {
  return (
    <>
      <Hero
        title="Press resources & brand assets"
        subtitle="Logos, screenshots, and a one-page overview."
        cta={{ label: "Download All Assets", href: "#download-all" }}
        secondaryCta={{ label: "Contact Press Team", href: "mailto:press@wherenext.com" }}
      />

      {/* Fact Sheet */}
      <Section title="Company Overview" subtitle="Key facts and figures">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">One-Line Description</h3>
            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <p className="text-lg font-medium text-gray-900">
                "Where Next is an AI-powered travel platform that combines trip planning, budget tracking, and booking tools in one integrated experience."
              </p>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Facts</h3>
            <div className="space-y-4">
              {factSheet.map((fact, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">{fact.label}</span>
                  <span className="text-gray-600">{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Mission Statement</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                We believe travel planning should feel like possibility, not paperwork. Where Next makes it effortless to plan, budget, and book trips with AI-powered recommendations that respect your privacy and budget.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our goal is to eliminate the friction between dreaming about a trip and actually taking it.
              </p>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Milestones</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">50K+ Users in First Year</div>
                  <div className="text-sm text-gray-600">March 2024</div>
                </div>
              </div>
              <div className="flex items-start">
                <Award className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Product Hunt #3 Product of the Day</div>
                  <div className="text-sm text-gray-600">February 2024</div>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="w-5 h-5 text-purple-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Seed Funding Round Completed</div>
                  <div className="text-sm text-gray-600">January 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Brand Assets */}
      <Section title="Brand Assets" subtitle="Logos and visual identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Logo Package
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <p className="text-sm text-gray-600">Where Next Logo</p>
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors tap-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Light Version (SVG)
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors tap-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Dark Version (SVG)
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors tap-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG Pack
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Brand Guidelines
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Primary Blue:</strong> #2563EB</p>
                <p><strong>Typography:</strong> Inter, system fonts</p>
                <p><strong>Logo Usage:</strong> Minimum 24px height</p>
                <p><strong>Clear Space:</strong> 1x logo height on all sides</p>
              </div>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors tap-lg">
                <Download className="w-4 h-4 mr-2" />
                Download Full Guidelines (PDF)
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Product Screenshots */}
      <Section title="Product Screenshots" subtitle="High-resolution images for media use">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-48 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Homepage Screenshot</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Homepage</h3>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm tap-lg">
                <Download className="w-4 h-4 mr-2" />
                Download (PNG, 2400x1600)
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-48 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Dashboard Screenshot</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm tap-lg">
                <Download className="w-4 h-4 mr-2" />
                Download (PNG, 2400x1600)
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-48 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Mobile App Screenshot</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Mobile App</h3>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm tap-lg">
                <Download className="w-4 h-4 mr-2" />
                Download (PNG, 1170x2532)
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Founder Bios */}
      <Section title="Leadership Team" subtitle="Founder bios and photos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {founders.map((founder, index) => (
            <div key={index} className="bg-white card-spacing rounded-2xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {founder.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{founder.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{founder.title}</p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{founder.bio}</p>
                  <a
                    href={`mailto:${founder.contact}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {founder.contact}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Press Contact */}
      <Section title="Press Contact">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need More Information?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            For press inquiries, interview requests, or additional assets, contact our press team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:press@wherenext.com"
              className="tap-lg inline-flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              press@wherenext.com
            </a>
            <a
              href="#download-all"
              className="tap-lg inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Assets
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
