'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Wrench, 
  User as UserIcon,
  Menu,
  X,
  ShoppingCart,
  Plus
} from 'lucide-react';

const navigationTabs = [
  { 
    id: 'dashboard', 
    label: 'Home', 
    href: '/dashboard', 
    icon: Home 
  },
  { 
    id: 'trips', 
    label: 'Trips', 
    href: '/trips', 
    icon: MapPin 
  },
  { 
    id: 'budget', 
    label: 'Budget', 
    href: '/budget', 
    icon: DollarSign 
  },
  { 
    id: 'addons', 
    label: 'Add-Ons', 
    href: '/addons', 
    icon: Plus 
  },
  { 
    id: 'cart', 
    label: 'Cart', 
    href: '/cart', 
    icon: ShoppingCart 
  },
  { 
    id: 'utilities', 
    label: 'Utilities', 
    href: '/utilities', 
    icon: Wrench 
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    href: '/profile', 
    icon: UserIcon 
  },
];

export default function AppNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile App Header */}
      <div className="md:hidden">
        <AppHeader />
      </div>
      
      {/* Desktop Header - Keep existing */}
      <div className="hidden md:block lg:hidden bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WN</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Where Next</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-white">
            <div className="grid grid-cols-2 gap-1 p-4">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WN</span>
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Where Next</h1>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  Guest User
                </p>
                <p className="text-xs text-gray-500">Preview Mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
