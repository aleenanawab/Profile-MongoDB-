'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Users, QrCode, CalendarDays, Settings } from 'lucide-react';

interface OwnerBottomNavProps {
  profileHref?: string;
}

export function OwnerBottomNav({ profileHref = '/my-profile' }: OwnerBottomNavProps) {
  const pathname = usePathname() || '';

  const navItems = [
    {
      key: 'profile',
      label: 'Profile',
      href: profileHref,
      icon: User,
      active:
        pathname === '/my-profile' ||
        (pathname.startsWith('/profile/') && !pathname.endsWith('/share'))
    },
    {
      key: 'contacts',
      label: 'Contacts',
      href: '/contacts',
      icon: Users,
      active: pathname.startsWith('/contacts')
    },
    {
      key: 'scan',
      label: 'Scan',
      href: '/scan',
      icon: QrCode,
      active: pathname.startsWith('/scan')
    },
    {
      key: 'events',
      label: 'Events',
      href: '/events',
      icon: CalendarDays,
      active: pathname.startsWith('/events')
    },
    {
      key: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings')
    }
  ];

  return (
    <nav
      aria-label="Workspace navigation"
      data-testid="owner-bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 dark:border-zinc-800 bg-[#FAF7F2]/95 dark:bg-zinc-950/95 backdrop-blur-md pb-[max(0px,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-3xl mx-auto px-2 py-1.5 grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`min-h-[48px] px-1.5 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                item.active
                  ? 'bg-[#7A1C33]/10 text-[#7A1C33] dark:bg-amber-400/15 dark:text-amber-300 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white font-medium'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
