import Link from 'next/link';

export function Breadcrumbs({ currentTitle }: { currentTitle: string }) {
  return (
    <nav className="mb-4 text-sm text-muted">
      <Link href="/" className="hover:text-text">
        Inicio
      </Link>{' '}
      /{' '}
      <Link href="/search" className="hover:text-text">
        Docs
      </Link>{' '}
      / <span className="text-text">{currentTitle}</span>
    </nav>
  );
}
