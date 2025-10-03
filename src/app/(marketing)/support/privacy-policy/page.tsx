import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import { 
  Shield, 
  Eye, 
  Lock, 
  UserCheck,
  Mail,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Privacy Policy | Where Next",
  description: "How we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Hero
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your data."
        eyebrow="Last updated: March 1, 2024"
        align="left"
        cta={{ label: "Contact Privacy Team", href: "mailto:privacy@wherenext.com" }}
        secondaryCta={{ label: "Download PDF", href: "#download-pdf" }}
      />

      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Overview */}
          <div className="bg-blue-50 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-3" />
              Our Commitment to Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At Where Next, we believe your travel data belongs to you. This privacy policy explains how we collect, 
              use, and protect your information when you use our travel planning platform. We're committed to 
              transparency and giving you control over your data.
            </p>
          </div>

          {/* Key Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparency</h3>
              <p className="text-sm text-gray-600">We're clear about what data we collect and why.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Your Control</h3>
              <p className="text-sm text-gray-600">You can access, update, or delete your data anytime.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Security First</h3>
              <p className="text-sm text-gray-600">Industry-standard encryption and security measures.</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              When you create an account, we collect your name, email address, and password. We may also collect 
              optional profile information like your home city and travel preferences to personalize your experience.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Travel Data</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              We collect information about your trips, including destinations, dates, budgets, expenses, and itineraries. 
              This data helps us provide AI-powered recommendations and track your travel spending.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              We automatically collect information about how you use our service, including pages visited, 
              features used, and time spent on the platform. This helps us improve our product.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Device Information</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              We collect information about the device you use to access Where Next, including IP address, 
              browser type, operating system, and mobile device identifiers.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h2>
            
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Provide our service:</strong> Create and manage your trips, process bookings, and provide AI recommendations.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Personalization:</strong> Customize recommendations based on your travel style and preferences.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Communication:</strong> Send you booking confirmations, trip updates, and important service announcements.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Improve our service:</strong> Analyze usage patterns to enhance features and fix bugs.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Security:</strong> Detect and prevent fraud, unauthorized access, and other security threats.</span>
              </li>
            </ul>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Information Sharing</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              We do not sell your personal information to third parties. We may share your information in these limited circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              We work with trusted third-party services (like Stripe for payments and Amadeus for travel data) 
              who help us provide our service. These partners are contractually required to protect your data.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              We may disclose information if required by law, such as in response to a valid court order or 
              to protect the rights and safety of our users.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              If Where Next is acquired or merged with another company, your information may be transferred 
              as part of that transaction. We'll notify you of any such change.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              We implement industry-standard security measures to protect your data:
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Lock className="w-5 h-5 text-green-600 mr-3" />
                  <span>End-to-end encryption for sensitive data</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-3" />
                  <span>Row-level security in our database</span>
                </li>
                <li className="flex items-center">
                  <UserCheck className="w-5 h-5 text-green-600 mr-3" />
                  <span>Regular security audits and monitoring</span>
                </li>
                <li className="flex items-center">
                  <Eye className="w-5 h-5 text-green-600 mr-3" />
                  <span>Multi-factor authentication support</span>
                </li>
              </ul>
            </div>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Your Rights</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              You have the following rights regarding your personal data:
            </p>

            <ul className="space-y-4 text-gray-700 mb-8">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information in your account.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format.</li>
              <li><strong>Restriction:</strong> Limit how we process your data in certain circumstances.</li>
              <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
            </ul>

            <p className="text-gray-700 leading-relaxed mb-8">
              To exercise these rights, contact us at privacy@wherenext.com or through your account settings.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Data Retention</h2>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              We retain your personal data only as long as necessary to provide our service and comply with legal obligations. 
              Trip data is kept for up to 3 years after your last activity to help with future trip planning. 
              You can request earlier deletion of your data at any time.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Changes to This Policy</h2>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              We may update this privacy policy from time to time. We'll notify you of any material changes 
              by email or through our service. Your continued use of Where Next after such changes constitutes 
              acceptance of the updated policy.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Contact Us</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>

            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    Email
                  </h3>
                  <p className="text-gray-700">privacy@wherenext.com</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    Last Updated
                  </h3>
                  <p className="text-gray-700">March 1, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
