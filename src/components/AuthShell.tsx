import React from 'react';
import Link from 'next/link';
import { Logo } from './Navbar';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" aria-label="Zarkdroid">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm animate-slide-up space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="text-center text-sm text-mute">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function FormMessage({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${
        kind === 'error' ? 'border-ink' : 'border-line bg-soft text-mute'
      }`}
    >
      {children}
    </p>
  );
}
