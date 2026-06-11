import Link from 'next/link';
import Image from 'next/image';
import { getDocHref, navSections } from '@/lib/navigation';
import { getDocBySlug } from '@/lib/posts';

type CanvasItem = { label: string; description: string };

function extractDataProductCanvas(content: string): CanvasItem[] {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.toLowerCase().includes('data product canvas'));
  if (start === -1) return [];

  return lines
    .slice(start + 1, start + 12)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('\u25e6') || line.startsWith('-'))
    .map((line) => {
      const cleaned = line.replace(/^[\u25e6\-\s]+/, '');
      const colon = cleaned.indexOf(':');
      if (colon === -1) return { label: cleaned, description: '' };
      return {
        label: cleaned.slice(0, colon).trim(),
        description: cleaned.slice(colon + 1).trim(),
      };
    });
}

export default function HomePage() {
  const resumen = getDocBySlug('Summary');
  const canvas = resumen ? extractDataProductCanvas(resumen.content) : [];

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-7xl flex-col justify-center overflow-hidden px-4 py-2 md:px-6">
      <section className="mb-4 rounded-xl border border-border bg-bg px-4 py-2">
        <div className="mb-2 flex items-center gap-3">
          <Image src="/logo-portfolio.svg" alt="Logo" width={24} height={25} style={{ height: 'auto' }} className="rounded-sm" />
          <h1 className="text-xl font-semibold md:text-2xl">Ingeniería de Software Estadístico</h1>
        </div>
        <p className="text-sm text-muted">
          Arquitectura, DataOps, MLOps, gobernanza y operación de productos de datos.
        </p>
      </section>

      <div className="flex-1 grid-cols-1 gap-4 overflow-hidden">
        <section className="flex flex-col">
          <h2 className="text-base font-semibold">Data Product Canvas</h2>
          {canvas.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {canvas.map((item) => (
                <div key={item.label} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-muted leading-snug">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No se pudo extraer esta seccion.</p>
          )}
        </section>

        <section className="flex flex-col">
          <h2 className="mt-4 text-base font-semibold">Categorías</h2>
          <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {navSections
              .filter((s) => s.title !== 'Referencias')
              .map((section) => (
                <div key={section.title} className="rounded-lg border border-border p-2">
                  <p className="mb-1 text-xs font-semibold">{section.title}</p>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={`${item.slug}-${item.href ?? ''}`}>
                        <Link
                          href={item.href ?? getDocHref(item.slug)}
                          className="text-xs text-slate-600 transition-colors hover:text-slate-800 hover:underline dark:text-slate-200 dark:hover:text-slate-100"
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
      </div>
    </div>
  );
}
