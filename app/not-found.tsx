import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-sm font-semibold text-[#0f5362]">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        Page introuvable
      </h1>
      <p className="mt-2 text-gray-600">
        La page demandée n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-[#0f5362] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a9d8f]"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
