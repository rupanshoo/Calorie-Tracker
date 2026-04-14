'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, TrendingUp, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/food', label: 'Food Log', icon: UtensilsCrossed },
  { href: '/exercise', label: 'Exercise', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:top-0 md:bottom-auto md:left-0 md:right-auto md:w-20 md:h-screen md:border-t-0 md:border-r md:flex md:flex-col md:items-center md:pt-8 md:gap-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 md:py-3 md:px-3 md:w-16 md:rounded-xl transition-all ${
              active
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}

      {/* Dark mode toggle — hidden on mobile bottom nav, visible on desktop sidebar */}
      <button
        onClick={toggle}
        className="hidden md:flex flex-col items-center justify-center gap-1 px-3 py-3 w-16 rounded-xl mt-auto mb-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <Sun size={22} /> : <Moon size={22} />}
        <span className="text-[10px] font-medium">{dark ? 'Light' : 'Dark'}</span>
      </button>

      {/* Mobile dark mode toggle — shown inline on mobile */}
      <button
        onClick={toggle}
        className="md:hidden flex flex-col items-center justify-center gap-1 px-4 py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
      >
        {dark ? <Sun size={22} /> : <Moon size={22} />}
        <span className="text-[10px] font-medium">{dark ? 'Light' : 'Dark'}</span>
      </button>
    </nav>
  );
}
