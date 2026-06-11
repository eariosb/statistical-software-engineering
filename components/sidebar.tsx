"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { getDocHref } from '@/lib/navigation';
import type { NavSection } from '@/lib/navigation';

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const state = useMemo(() => {
    const base: Record<string, boolean> = {};
    sections.forEach((section) => {
      base[section.title] = true;
    });
    return { ...base, ...openSections };
  }, [sections, openSections]);

  return (
    <aside className="h-full overflow-y-auto border-r border-border px-4 py-6">
      <nav className="space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between text-left text-sm font-semibold text-muted"
              onClick={() => setOpenSections((prev) => ({ ...prev, [section.title]: !state[section.title] }))}
            >
              {section.title}
              <ChevronDown className={clsx('h-4 w-4 transition', !state[section.title] && '-rotate-90')} />
            </button>

            {state[section.title] && (
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const href = item.href ?? getDocHref(item.slug);
                  const activePath = href.split('#')[0];
                  const active = pathname === activePath || pathname === `${activePath}/`;

                  return (
                    <li key={`${item.slug}-${href}`}>
                      <Link
                        href={href}
                        className={clsx(
                          'block rounded-md px-2 py-1.5 text-sm transition hover:bg-codebg',
                          active ? 'bg-codebg text-text' : 'text-muted'
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
