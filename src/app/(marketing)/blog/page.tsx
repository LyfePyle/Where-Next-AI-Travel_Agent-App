'use client';

import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import blogData from '@/data/marketing/blog.sample.json';
import { 
  Calendar, 
  User, 
  Tag,
  ArrowRight,
  Mail,
  Search
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Blog | Where Next",
  description: "Guides, product updates, and travel tactics.",
};

// Get featured post (first one)
const featuredPost = blogData[0];
const otherPosts = blogData.slice(1);

// Group posts by tag for categories
const categories = [...new Set(blogData.map(post => post.tag))];

export default function BlogPage() {
  return (
    <>
      <Hero
        title="Travel, tools, and the road ahead."
        subtitle="Stories and updates from the team and community."
        cta={{ label: "Subscribe to Updates", href: "#newsletter" }}
        secondaryCta={{ label: "Browse Categories", href: "#categories" }}
      />

      {/* Search Bar */}
      <Section>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Search query:', e.currentTarget.value);
                  // TODO: Implement search functionality
                }
              }}
            />
          </div>
        </div>
      </Section>

      {/* Featured Post */}
      <Section title="Featured Article">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                {featuredPost.tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {featuredPost.title}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center text-sm text-gray-500 mb-6">
                <User className="w-4 h-4 mr-2" />
                <span className="mr-4">{featuredPost.author}</span>
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <a
                href={`/blog/${featuredPost.slug}`}
                className="tap-lg inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Read Full Article
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl h-64 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Featured Article Image</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Categories */}
      <Section id="categories" title="Browse by Category">
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium"
              onClick={() => {
                console.log('Filter by category:', category);
                // TODO: Implement category filtering
              }}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              {category}
            </button>
          ))}
        </div>
      </Section>

      {/* Recent Posts Grid */}
      <Section title="Recent Articles">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl h-48 mb-4 flex items-center justify-center">
                <span className="text-gray-600 font-medium">Article Image</span>
              </div>
              
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                {post.tag}
              </span>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{new Date(post.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
              
              <a
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors text-sm"
              >
                Read More
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </article>
          ))}
        </div>
      </Section>

      {/* Newsletter Signup */}
      <Section id="newsletter">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Get the latest travel tips, product updates, and destination guides delivered to your inbox weekly.
          </p>
          <form 
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email');
              console.log('Newsletter signup:', email);
              // TODO: Implement newsletter signup
              alert('Thanks for subscribing! (Demo mode)');
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button
              type="submit"
              className="tap-lg px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5 inline mr-2" />
              Subscribe
            </button>
          </form>
          <p className="text-sm text-blue-200 mt-4">
            No spam, unsubscribe anytime. Read our privacy policy.
          </p>
        </div>
      </Section>
    </>
  );
}
