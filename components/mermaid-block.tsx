"use client";

import mermaid from 'mermaid';
import { useEffect, useId, useState } from 'react';

export function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const id = useId();

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    mermaid
      .render(`mermaid-${id.replace(/:/g, '')}`, chart)
      .then((res) => setSvg(res.svg))
      .catch(() => setSvg('<pre>Diagrama Mermaid no válido.</pre>'));
  }, [chart, id]);

  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
