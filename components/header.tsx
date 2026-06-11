import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-text md:text-base">
          <Image src="/logo-portfolio.svg" alt="Logo" width={20} height={21} style={{ height: 'auto' }} className="rounded-sm" />
          <span className="truncate">Ingeniería de Software Estadístico</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm hover:bg-codebg"
          >
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
