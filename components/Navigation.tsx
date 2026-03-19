'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, FolderKanban, KeyRound, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="fixed left-4 top-6 z-40 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="space-y-2">
        <NavLink href="/tableau-de-bord" active={isActive('/tableau-de-bord')} icon={<LayoutDashboard size={16} />}>
          DASHBOARD
        </NavLink>
        <NavLink href="/projets" active={isActive('/projets')} icon={<FolderKanban size={16} />}>
          PROJETS
        </NavLink>
        <NavLink href="/personnes" active={isActive('/personnes')} icon={<Users size={16} />}>
          RESOURCES
        </NavLink>
        <NavLink href="/entites" active={isActive('/entites')} icon={<Building2 size={16} />}>
          ENTITE
        </NavLink>
        <NavLink href="/comptes-acces" active={isActive('/comptes-acces')} icon={<ShieldCheck size={16} />}>
          COMPTES
        </NavLink>
        <NavLink href="/profil" active={isActive('/profil')} icon={<KeyRound size={16} />}>
          PROFIL
        </NavLink>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
  icon,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        aria-label={String(children)}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          active
            ? 'bg-primary text-white shadow-lg'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {icon}
      </Link>
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {children}
      </span>
    </div>
  );
}
