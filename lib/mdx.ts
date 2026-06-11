import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function extractToc(markdown: string): TocItem[] {
  const matches = [...markdown.matchAll(/^(#{1,3})\s+(.+)$/gm)];

  const excludedPatterns = [
    /^¿Qué valor/i,
    /^Producto Final/i,
    /^Utilidad/i,
    /^Prerrequisitos/i,
    /^Resumen/i,
    /^Notas/i,
    /^Referencias/i,
  ];

  return matches
    .filter((match) => {
      const level = match[1].length;
      const text = match[2].trim();

      // Excluir h1 (título principal)
      if (level === 1) return false;

      // Excluir h2 que coincidan con patrones introductorios
      if (level === 2 && excludedPatterns.some((pattern) => pattern.test(text))) {
        return false;
      }

      return true;
    })
    .map((match) => ({
      id: slugify(match[2]),
      text: match[2].trim(),
      level: match[1].length as 2 | 3
    }));
}

export async function renderMdx(source: string) {
  const result = await compileMDX({
    source,
    components: {},
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeHighlight]
      }
    }
  });

  return result.content;
}
