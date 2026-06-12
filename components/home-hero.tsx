import Image from 'next/image';

export function HomeHero() {
  return (
    <section className="flex-shrink-0 rounded-lg border border-border bg-bg p-2 md:p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded bg-surface border border-border">
          <Image
            src="/logo-portfolio.svg"
            alt="Logo"
            width={18}
            height={18}
            style={{ height: 'auto' }}
            className="rounded-sm"
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight text-text md:text-base">
            Ingeniería de Software Estadístico
          </h1>
          <p className="text-xs leading-tight text-muted md:text-xs">
            Arquitectura, DataOps, MLOps, gobernanza y operación de productos de datos.
          </p>
        </div>
      </div>
    </section>
  );
}
