'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, useSession } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { safeNext } from '@/lib/redirect';

// Reachable without an account.
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/privacy', '/download'];
// Signed-in users have no reason to see these (reset-password needs the recovery session, so it is excluded).
const GUEST_ONLY_PATHS = ['/login', '/signup', '/forgot-password'];

function Centered({ children }: { children?: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-mute">{children}</div>;
}

/** Requires an account for the whole app and loads the user's cloud data right after login. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const [syncedUser, setSyncedUser] = useState<string | null>(null);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublic) {
      // Remember where the user was going (e.g. the OAuth consent screen) and come back after login.
      const here = pathname + window.location.search;
      router.replace(here === '/' ? '/login' : `/login?next=${encodeURIComponent(here)}`);
    } else if (session && GUEST_ONLY_PATHS.includes(pathname)) {
      router.replace(safeNext(new URLSearchParams(window.location.search).get('next')));
    }
  }, [loading, session, isPublic, pathname, router]);

  useEffect(() => {
    if (!userId || syncedUser === userId) return;
    let cancelled = false;
    storage.syncOnLogin().finally(() => {
      if (!cancelled) setSyncedUser(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, syncedUser]);

  if (isPublic && !session) return <>{children}</>;
  if (loading) return <Centered>Carregando…</Centered>;

  if (!auth.isAvailable()) {
    return (
      <Centered>
        <div className="max-w-xs space-y-3">
          <p>O login não está configurado. Tente novamente mais tarde.</p>
          <Link href="/privacy" className="underline">
            Política de Privacidade
          </Link>
        </div>
      </Centered>
    );
  }

  if (!session) return <Centered>Redirecionando…</Centered>;
  if (isPublic) return <>{children}</>;
  if (syncedUser !== userId) return <Centered>Sincronizando seus baralhos…</Centered>;

  return <>{children}</>;
}
