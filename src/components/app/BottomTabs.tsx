'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, DollarSign, Plus, User } from 'lucide-react';

const tabs = [
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
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: User
  }
];

export default function BottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 h-16 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
      <div className="grid grid-cols-5 h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                active 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={tab.label}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
