'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicAuthPage = pathname === '/accueil' || pathname === '/connexion';

  if (isPublicAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pl-0 pr-4 pt-6 md:pl-[110px]">
        <div className="mx-auto max-w-7xl">
          <PageHeader />
          {children}
        </div>
      </main>
    </>
  );
}
