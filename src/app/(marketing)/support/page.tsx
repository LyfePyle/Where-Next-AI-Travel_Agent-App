'use client';

import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import helpData from '@/data/marketing/help.sample.json';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone,
  ArrowRight,
  Star,
  Clock
} from 'lucide-react';

// Get popular articles
const popularArticles = helpData.filter(article => article.popular);
const categories = [...new Set(helpData.map(article => article.category))];

export default function SupportPage() {
  return (
    <>
      <Hero
        title="Find answers fast."
        subtitle="Search articles or contact support."
        cta={{ label: "Contact Support", href: "/support/contact" }}
        secondaryCta={{ label: "Browse All Articles", href: "#all-articles" }}
      />

      {/* Search Bar */}
      <Section>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Search query:', e.currentTarget.value);
                  // TODO: Implement search functionality
                }
              }}
            />
          </div>
          <p className="text-center text-gray-600 mt-4">
            Try searching for "getting started", "payments", or "booking flights"
          </p>
        </div>
      </Section>

      {/* Popular Articles */}
      <Section title="Popular Articles" subtitle="Most helpful guides">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                console.log('Open article:', article.id);
                // TODO: Navigate to article detail
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {article.category}
                </span>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {article.content}
              </p>
              
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                <span>Read Article</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Categories */}
      <Section title="Browse by Category" subtitle="Find articles organized by topic">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const categoryArticles = helpData.filter(article => article.category === category);
            const categoryIcons = {
              'Basics': <BookOpen className="w-8 h-8 text-blue-600" />,
              'Billing': <Phone className="w-8 h-8 text-green-600" />,
              'Trips': <ArrowRight className="w-8 h-8 text-purple-600" />,
              'Budget': <Star className="w-8 h-8 text-orange-600" />,
              'AI': <Clock className="w-8 h-8 text-red-600" />,
              'Bookings': <MessageCircle className="w-8 h-8 text-indigo-600" />,
              'Security': <Search className="w-8 h-8 text-pink-600" />,
              'Mobile': <BookOpen className="w-8 h-8 text-teal-600" />,
              'Tools': <Star className="w-8 h-8 text-amber-600" />,
              'Support': <MessageCircle className="w-8 h-8 text-cyan-600" />
            };
            
            return (
              <div
                key={category}
                className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  console.log('Browse category:', category);
                  // TODO: Filter articles by category
                }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-colors">
                    {categoryIcons[category as keyof typeof categoryIcons] || <BookOpen className="w-8 h-8 text-gray-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {categoryArticles.length} article{categoryArticles.length !== 1 ? 's' : ''}
                  </p>
                  <div className="text-blue-600 font-semibold text-sm">
                    Browse →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* All Articles */}
      <Section id="all-articles" title="All Help Articles">
        <div className="space-y-4">
          {helpData.map((article) => (
            <div
              key={article.id}
              className="bg-white card-spacing rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 group cursor-pointer"
              onClick={() => {
                console.log('Open article:', article.id);
                // TODO: Navigate to article detail
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full mr-3">
                      {article.category}
                    </span>
                    {article.popular && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {article.content.substring(0, 120)}...
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact Support */}
      <Section>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Still Need Help?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you get the most out of Where Next.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support/contact"
              className="tap-lg inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Support
            </a>
            <a
              href="mailto:help@wherenext.com"
              className="tap-lg inline-flex items-center px-8 py-4 bg-blue-700 text-white font-bold rounded-2xl hover:bg-blue-800 transition-colors border-2 border-blue-400"
            >
              <Phone className="w-5 h-5 mr-2" />
              help@wherenext.com
            </a>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Average response time: 4 hours • Available 24/7
          </p>
        </div>
      </Section>
    </>
  );
}
