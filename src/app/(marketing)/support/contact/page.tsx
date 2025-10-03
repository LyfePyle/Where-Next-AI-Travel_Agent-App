'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Paperclip,
  Send
} from 'lucide-react';

// Note: This would normally be export const metadata, but since we're using 'use client', 
// we'll handle metadata in a parent server component or via Next.js head
const pageMetadata = {
  title: "Contact | Where Next",
  description: "Talk to us—billing, account, or feedback.",
};

const topics = [
  'General Question',
  'Account & Billing',
  'Technical Issue', 
  'Feature Request',
  'Partnership Inquiry',
  'Press & Media',
  'Other'
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    console.log('Contact form submission:', formData);
    
    // TODO: Replace with actual API call to /api/support/ticket
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSubmitted) {
    return (
      <>
        <Hero
          title="Message sent successfully!"
          subtitle={`Thanks—your message is in. We'll reply at ${formData.email}`}
          cta={{ label: "Send Another Message", href: "/support/contact" }}
          secondaryCta={{ label: "Back to Help Center", href: "/support" }}
        />
        
        <Section>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              We've Got Your Message
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team typically responds within 4-6 hours during business hours. 
              For urgent issues, you can also reach us at help@wherenext.com.
            </p>
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• We'll review your message and gather any necessary information</p>
                <p>• A support specialist will email you with a personalized response</p>
                <p>• For technical issues, we may request additional details or screenshots</p>
              </div>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Hero
        title="How can we help?"
        subtitle="We typically reply within 24 hours."
        cta={{ label: "Browse Help Articles", href: "/support" }}
        secondaryCta={{ label: "Emergency? Email Us", href: "mailto:help@wherenext.com" }}
      />

      <Section>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
                What can we help you with? *
              </label>
              <select
                id="topic"
                name="topic"
                required
                value={formData.topic}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Please describe your question or issue in detail..."
              />
            </div>

            {/* Attachments (placeholder) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attachments (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload screenshots or documents
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap-lg w-full flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <Clock className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="font-semibold text-gray-900">Response Time</h3>
              </div>
              <p className="text-sm text-gray-600">
                We typically respond within 4-6 hours during business hours (9 AM - 6 PM PST, Monday-Friday).
              </p>
            </div>
            
            <div className="bg-green-50 rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <Mail className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="font-semibold text-gray-900">Direct Email</h3>
              </div>
              <p className="text-sm text-gray-600">
                For urgent matters, email us directly at{' '}
                <a href="mailto:help@wherenext.com" className="text-green-700 font-medium hover:underline">
                  help@wherenext.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
