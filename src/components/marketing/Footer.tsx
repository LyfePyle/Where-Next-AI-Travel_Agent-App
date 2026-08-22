'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Mail, Twitter, Facebook, Plane } from 'lucide-react';

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Trip Planning', href: '/product/trip-planning' },
      { label: 'Budget Tracker', href: '/budget' },
      { label: 'AI Agent', href: '/plan-trip' },
    ]
  },
  {
    title: 'Company', 
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { label: 'Travel Tools', href: '/tools' },
      { label: 'Walking Tours', href: '/walking-tour' },
      { label: 'Saved Trips', href: '/saved' },
    ]
  }
];

export default function Footer() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(title)) {
      newOpenSections.delete(title);
    } else {
      newOpenSections.add(title);
    }
    setOpenSections(newOpenSections);
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo and Description */}
        <div className="mb-8 pb-8 border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-2 text-white font-bold text-xl mb-4">
            <Plane className="h-8 w-8 text-blue-400" />
            <span>Where Next</span>
          </Link>
          <p className="text-gray-400 max-w-md">
            Your AI travel companion for smarter trips, better budgets, and unforgettable experiences.
          </p>
        </div>

        {/* Desktop Links Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden mb-8">
          {footerSections.map((section) => (
            <div key={section.title} className="border-b border-gray-800">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full py-4 flex items-center justify-between text-left tap-lg"
                aria-expanded={openSections.has(section.title)}
                aria-label={`Toggle ${section.title} section`}
              >
                <h3 className="font-semibold text-lg">{section.title}</h3>
                {openSections.has(section.title) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {openSections.has(section.title) && (
                <ul className="pb-4 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors block py-1"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Social Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm mb-4 sm:mb-0">
            © 2024 Where Next. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-4">
            <a
              href="mailto:hello@wherenext.com"
              className="text-gray-400 hover:text-white transition-colors tap-lg"
              aria-label="Email us"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/wherenext"
              className="text-gray-400 hover:text-white transition-colors tap-lg"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com/wherenext"
              className="text-gray-400 hover:text-white transition-colors tap-lg"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
