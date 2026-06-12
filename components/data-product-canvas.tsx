export function DataProductCanvas({ canvas }: { canvas: any[] }) {
  return (
    <section className="flex flex-col gap-1 rounded-lg border border-border bg-bg p-2 md:p-3">
      <h2 className="text-xs font-semibold text-text md:text-sm">Data Product Canvas</h2>

      {canvas.length ? (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {canvas.map((item) => (
            <article key={item.label} className="rounded border border-border bg-surface p-2 shadow-sm">
              <p className="text-xs font-semibold text-text">{item.label}</p>
              <p className="mt-0.5 text-xs leading-4 text-slate-600 dark:text-slate-300">
                {item.description || 'Sin descripción disponible.'}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">No se pudo extraer esta sección.</p>
      )}
    </section>
  );
}
