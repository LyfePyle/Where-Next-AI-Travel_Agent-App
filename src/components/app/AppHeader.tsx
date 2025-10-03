'use client';

import { usePathname } from 'next/navigation';
import { ShoppingCart, Bell } from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  title?: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const pathname = usePathname();
  
  // Generate title based on current path if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/trips')) return 'Trips';
    if (pathname.includes('/budget')) return 'Budget';
    if (pathname.includes('/addons')) return 'Add-Ons';
    if (pathname.includes('/cart')) return 'Cart';
    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/utilities')) return 'Utilities';
    
    return 'Where Next';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Page Title */}
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h1>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link
              href="/cart"
              className="tap-lg p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
              aria-label="View cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {/* Cart badge - could be dynamic */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Link>

            {/* Notifications */}
            <button
              className="tap-lg p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
