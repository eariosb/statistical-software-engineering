import fs from 'node:fs';
import path from 'node:path';
import { getAllDocsMeta, getDocBySlug } from '@/lib/posts';

export type SearchDoc = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  body: string;
};

function stripCodeBlocks(input: string): string {
  return input.replace(/```[\s\S]*?```/g, ' ');
}

function stripMarkdown(input: string): string {
  return input
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchDocs(): SearchDoc[] {
  const allDocs = getAllDocsMeta();
  const output: SearchDoc[] = [];

  allDocs.forEach((meta) => {
    const doc = getDocBySlug(meta.slug);
    if (!doc) {
      return;
    }

    output.push({
      id: meta.slug,
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      body: stripMarkdown(stripCodeBlocks(doc.content))
    });
  });

  return output;
}

export function writeSearchData(outDir = path.join(process.cwd(), 'public')) {
  const docs = buildSearchDocs();
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify(docs), 'utf8');
}
