"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FlexSearch from 'flexsearch';
import { getDocHref } from '@/lib/navigation';

type SearchDoc = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  body: string;
};

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[]>([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data: SearchDoc[]) => setDocs(data))
      .catch(() => setDocs([]));
  }, []);

  const index = useMemo(() => {
    const idx = new FlexSearch.Index({ tokenize: 'forward' });
    docs.forEach((doc) => {
      idx.add(doc.id, `${doc.title} ${doc.description ?? ''} ${doc.body} ${doc.slug}`);
    });
    return idx;
  }, [docs]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const hits = index.search(query, { limit: 10 }) as string[];
    const map = new Map(docs.map((doc) => [doc.id, doc]));

    return hits
      .map((id) => map.get(String(id)))
      .filter((doc): doc is SearchDoc => Boolean(doc));
  }, [index, query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-semibold">Búsqueda</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título o contenido..."
        className="h-11 w-full rounded-md border border-border bg-bg px-4"
      />

      <div className="mt-6 space-y-3">
        {results.map((result) => (
          <Link
            key={result.id}
            href={getDocHref(result.slug)}
            className="block rounded-md border border-border p-4 hover:bg-codebg"
          >
            <p className="font-medium">{result.title}</p>
            {result.description ? <p className="text-sm text-muted">{result.description}</p> : null}
          </Link>
        ))}

        {query.trim() && !results.length ? <p className="text-sm text-muted">Sin resultados.</p> : null}
      </div>
    </div>
  );
}
