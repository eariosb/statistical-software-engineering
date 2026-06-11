'use client';

import { useState } from 'react';
import type { TocItem } from '@/lib/mdx';
import { clsx } from 'clsx';

export function TableOfContents({ items, mobileOnly, desktopOnly }: { items: TocItem[]; mobileOnly?: boolean; desktopOnly?: boolean }) {
  const [open, setOpen] = useState(false);

  if (!items.length) {
    return null;
  }

  return (
    <>
      {/* Desktop: fixed right sidebar */}
      {!mobileOnly && (
        <aside className="hidden xl:sticky xl:top-20 xl:block h-[calc(100vh-4rem)] overflow-y-auto border-l border-border px-4 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Contenido</p>
          <TocList items={items} />
        </aside>
      )}

      {/* Mobile: accordion below title */}
      {!desktopOnly && (
        <div className="xl:hidden">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex w-full items-center justify-between border-b border-border px-6 py-3 text-sm font-medium text-muted hover:text-text transition-colors"
          >
            Contenido
            <span className="text-xs">{open ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          {open && (
            <div className="border-b border-border px-6 py-4">
              <TocList items={items} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function TocList({ items }: { items: TocItem[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={`${item.id}-${idx}`}>
          <a
            href={`#${item.id}`}
            className={clsx(
              'block text-sm text-muted hover:text-text transition-colors',
              item.level === 2 && 'pl-3',
              item.level === 3 && 'pl-6'
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}
