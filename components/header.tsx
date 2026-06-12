import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between gap-3 px-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 truncate text-xs font-semibold text-text md:text-sm">
          <Image src="/logo-portfolio.svg" alt="Logo" width={18} height={18} style={{ height: 'auto' }} className="rounded-sm" />
          <span className="truncate">Ingeniería de Software Estadístico</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-xs hover:bg-codebg"
          >
            <Search className="mr-1 h-3 w-3" /> Buscar
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
