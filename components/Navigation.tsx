'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart2, Building2, CalendarClock, FolderKanban, KeyRound, LayoutDashboard, LogOut, Repeat2, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SessionInfo {
  estSuperAdmin: boolean;
  role: string; // AGENT | GESTIONNAIRE | COORDINATEUR | ADMINISTRATEUR
}

export default function Navigation() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [session, setSession]       = useState<SessionInfo | null>(null);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSession({ estSuperAdmin: data.estSuperAdmin, role: data.role ?? 'AGENT' });
      })
      .catch(() => {/* silently */});
  }, []);

  const isAdmin = session?.estSuperAdmin || session?.role === 'ADMINISTRATEUR';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/connexion');
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <nav className="fixed left-4 top-6 z-40 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="space-y-1.5">

        <NavLink href="/tableau-de-bord" active={isActive('/tableau-de-bord')} icon={<LayoutDashboard size={16} />}>
          DASHBOARD
        </NavLink>

        <hr className="border-slate-200 my-1.5 mx-1" />

        <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Projets</p>
        <SubNavLink href="/projets/tableau-de-bord" active={isActive('/projets/tableau-de-bord')} icon={<BarChart2 size={14} />}>
          DASHBOARD PROJETS
        </SubNavLink>
        <SubNavLink
          href="/projets"
          active={pathname === '/projets' || (pathname.startsWith('/projets/') && !pathname.startsWith('/projets/tableau-de-bord'))}
          icon={<FolderKanban size={14} />}
        >
          LISTE PROJETS
        </SubNavLink>

        <hr className="border-slate-200 my-1.5 mx-1" />

        <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Opérations</p>
        <SubNavLink href="/operations" active={isActive('/operations')} icon={<Repeat2 size={14} />}>
          DASHBOARD OPÉRATIONS
        </SubNavLink>
        <SubNavLink href="/occurrences" active={isActive('/occurrences')} icon={<CalendarClock size={14} />}>
          OCCURRENCES
        </SubNavLink>

        <hr className="border-slate-200 my-1.5 mx-1" />

        <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Administration</p>
        <SubNavLink href="/personnes" active={isActive('/personnes')} icon={<Users size={14} />}>
          RESOURCES
        </SubNavLink>
        <SubNavLink href="/entites" active={isActive('/entites')} icon={<Building2 size={14} />}>
          ENTITE
        </SubNavLink>

        {/* Comptes : visible uniquement pour les ADMINISTRATEURS */}
        {(session === null || isAdmin) && (
          <SubNavLink href="/comptes-acces" active={isActive('/comptes-acces')} icon={<ShieldCheck size={14} />}>
            COMPTES
          </SubNavLink>
        )}

        <SubNavLink href="/profil" active={isActive('/profil')} icon={<KeyRound size={14} />}>
          PROFIL
        </SubNavLink>
        <SubNavAction
          onClick={handleLogout}
          icon={<LogOut size={14} />}
          label={loggingOut ? 'DÉCONNEXION...' : 'DÉCONNEXION'}
          disabled={loggingOut}
        />

      </div>
    </nav>
  );
}

function NavLink({ href, active, children, icon }: {
  href: string; active: boolean; children: React.ReactNode; icon: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        aria-label={String(children)}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          active ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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

function SubNavLink({ href, active, children, icon }: {
  href: string; active: boolean; children: React.ReactNode; icon: React.ReactNode;
}) {
  return (
    <div className="group relative ml-2">
      <Link
        href={href}
        aria-label={String(children)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          active ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

function SubNavAction({ onClick, icon, label, disabled = false }: {
  onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean;
}) {
  return (
    <div className="group relative ml-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {icon}
      </button>
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}
