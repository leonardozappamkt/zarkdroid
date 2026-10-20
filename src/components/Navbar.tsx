'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

interface NavbarProps {
  onOpenNewDeck?: () => void;
  onOpenNewCard?: () => void;
}

const NAV_ITEMS = [
  { label: 'Baralhos', href: '/' },
  { label: 'Configurações', href: '/settings' },
  { label: 'Download', href: '/download' },
];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink font-mono text-sm font-bold text-paper">
        Z
      </span>
      <span className="text-base font-semibold tracking-tight">Zarkdroid</span>
    </span>
  );
}

export default function Navbar({ onOpenNewDeck, onOpenNewCard }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Zarkdroid">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active ? 'bg-soft font-medium text-ink' : 'text-mute hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewCard && (
            <button onClick={onOpenNewCard} className="btn-outline">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Card</span>
            </button>
          )}
          {onOpenNewDeck && (
            <button onClick={onOpenNewDeck} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Baralho</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                active ? 'bg-soft font-medium text-ink' : 'text-mute'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
