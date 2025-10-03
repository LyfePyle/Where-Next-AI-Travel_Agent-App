import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import { 
  FileText, 
  Scale, 
  CreditCard, 
  AlertCircle,
  Mail,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Terms of Service | Where Next",
  description: "Terms that govern your use of Where Next.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Hero
        title="Terms of Service"
        subtitle="Terms that govern your use of Where Next."
        eyebrow="Last updated: March 1, 2024"
        align="left"
        cta={{ label: "Contact Legal Team", href: "mailto:legal@wherenext.com" }}
        secondaryCta={{ label: "View Privacy Policy", href: "/support/privacy-policy" }}
      />

      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Overview */}
          <div className="bg-blue-50 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Scale className="w-6 h-6 text-blue-600 mr-3" />
              Agreement Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By using Where Next, you agree to these terms of service. These terms govern your use of our 
              travel planning platform, including our website, mobile app, and related services. Please read 
              them carefully.
            </p>
          </div>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fair Use</h3>
              <p className="text-sm text-gray-600">Use our service responsibly and in accordance with our guidelines.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Clear Billing</h3>
              <p className="text-sm text-gray-600">Transparent pricing with no hidden fees or surprise charges.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Your Responsibility</h3>
              <p className="text-sm text-gray-600">You're responsible for your account security and booking decisions.</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              By accessing or using Where Next, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our service. We may update these terms from time 
              to time, and your continued use constitutes acceptance of any changes.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Description of Service</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Where Next is a travel planning platform that provides:
            </p>

            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>AI-powered trip planning and recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Budget tracking and expense management tools</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Flight and accommodation booking services</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Travel utilities and planning tools</span>
              </li>
            </ul>

            <p className="text-gray-700 leading-relaxed mb-8">
              Our service is provided "as is" and we reserve the right to modify, suspend, or discontinue 
              any part of the service at any time with reasonable notice.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Creation</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              To use certain features of Where Next, you must create an account. You must provide accurate, 
              current, and complete information during registration and keep your account information updated.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Security</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              You are responsible for maintaining the confidentiality of your account credentials and for 
              all activities that occur under your account. Please notify us immediately of any unauthorized 
              use of your account.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Termination</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              You may delete your account at any time through your account settings. We may suspend or 
              terminate accounts that violate these terms or engage in harmful activity.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Acceptable Use</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              You agree not to use Where Next for any unlawful purpose or in any way that could damage, 
              disable, or impair our service. Specifically, you agree not to:
            </p>

            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Violate any applicable laws or regulations</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Upload malicious code or attempt to hack our systems</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Use automated tools to access our service without permission</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Impersonate others or provide false information</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Interfere with other users' enjoyment of the service</span>
              </li>
            </ul>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Payments and Refunds</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our pricing is clearly displayed before you make any purchase. All prices are in USD unless 
              otherwise specified. We reserve the right to change our pricing with reasonable notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Payments are processed securely through Stripe. By providing payment information, you authorize 
              us to charge the applicable fees to your chosen payment method.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Refund Policy</h3>
            <div className="bg-green-50 rounded-2xl p-6 mb-8">
              <ul className="space-y-3 text-gray-700">
                <li><strong>Service subscriptions:</strong> 30-day money-back guarantee</li>
                <li><strong>Flight bookings:</strong> Subject to airline cancellation policies</li>
                <li><strong>Hotel bookings:</strong> Subject to hotel cancellation policies</li>
                <li><strong>Premium features:</strong> Pro-rated refunds available</li>
              </ul>
            </div>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Booking Services</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Where Next facilitates bookings with airlines, hotels, and other travel providers. We act as an 
              intermediary and are not responsible for the performance of these third-party services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Terms</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              When you book through our platform, you are also subject to the terms and conditions of the 
              airline, hotel, or other service provider. Please review these terms before booking.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Changes</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              Changes to bookings are subject to the policies of the service provider and may incur additional 
              fees. We will assist you with changes when possible, but cannot guarantee availability or pricing.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Limitation of Liability</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    To the maximum extent permitted by law, Where Next shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including but not limited to loss 
                    of profits, data, or goodwill, arising out of your use of our service.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-8">
              Our total liability to you for any claims arising out of or relating to these terms or your use 
              of Where Next shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Intellectual Property</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              The Where Next service, including its design, functionality, and content, is protected by 
              copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              distribute, or create derivative works based on our service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Content</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              You retain ownership of any content you submit to Where Next (such as trip reviews or photos). 
              By submitting content, you grant us a license to use, display, and distribute that content 
              in connection with our service.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Changes to Terms</h2>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              We may update these Terms of Service from time to time. We will notify you of any material 
              changes by email or through our service. Your continued use of Where Next after such changes 
              constitutes acceptance of the updated terms.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Governing Law</h2>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              These terms are governed by the laws of the State of California, without regard to conflict 
              of law principles. Any disputes will be resolved in the courts of San Francisco County, California.
            </p>

            <hr className="border-gray-200 my-8" />

            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Contact Information</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              If you have questions about these Terms of Service, please contact us:
            </p>

            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    Legal Team
                  </h3>
                  <p className="text-gray-700">legal@wherenext.com</p>
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
