import { Sidebar } from '@/components/sidebar';
import { navSections } from '@/lib/navigation';
import type { ReactNode } from 'react';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden xl:block">
          <Sidebar sections={navSections} />
        </div>
        <div>{children}</div>
    </div>
  );
}
