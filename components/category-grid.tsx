import Link from 'next/link';
import type { NavSectionItem } from '@/lib/navigation';

export type CategorySection = {
  title: string;
  items: NavSectionItem[];
};

export function CategoryGrid({ sections, getDocHref }: { sections: CategorySection[]; getDocHref: (slug: string) => string }) {
  return (
    // Oculto en móvil, visible como flex en sm+
    <section className="hidden sm:flex sm:flex-col gap-1 rounded-lg border border-border bg-bg p-2 md:p-3 min-h-0 flex-1 overflow-hidden">
      <h2 className="text-xs font-semibold text-text md:text-sm">Categorías</h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="rounded border border-border bg-surface p-2 min-h-0">
            <p className="text-xs font-semibold text-text line-clamp-1">{section.title}</p>
            <ul className="mt-0.5 space-y-0 text-xs leading-4 text-slate-600 dark:text-slate-200">
              {section.items.map((item) => (
                <li key={`${item.slug}-${item.href ?? ''}`} className="line-clamp-1">
                  <Link
                    href={item.href ?? getDocHref(item.slug)}
                    className="block text-[var(--accent)] transition-colors hover:text-indigo-400 dark:hover:text-slate-100"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}