import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getAllNavItems } from '@/lib/navigation';

export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
  fileName: string;
};

export const ROOT_DIR = process.cwd();
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');

const fileAliasMap: Record<string, string[]> = {
  Resumen: ['Summary.md'],
  Manual_Completo: ['Complete_Manual.md'],
  Principios_Software_Estadistico: ['Statistical_Software_Principles.md'],
  Guia_Implementacion_Sist_Estadisticos: ['Statistical_Systems_Implementation_Guide.md'],
  MLFlow: ['MLflow.md'],
  Costos_Eficiencia: ['Cost_Efficiency.md'],
  Cultura_Datos: ['Data_Culture.md'],
  DataOps_Ingenieria_Estadistica: ['DataOps_Statistical_Engineering.md'],
  Gestion_Secretos: ['Secrets_Management.md'],
  Pruebas_Integracion: ['Integration_Tests.md'],
  Checklist_Compliance_MLOps: ['MLOps_Compliance_Checklist.md'],
  Buenas_Practicas_Shiny: ['Shiny_Best_Practices.md'],
  Presentacion_Visualizacion_React: ['React_Visualization_Presentation.md'],
  UXUI: ['UX_UI.md'],
  Buenas_Practicas_Librerias_Visualizacion: ['Visualization_Libraries_Best_Practices.md'],
  Skills_Microagentes: ['Microagent_Skills.md']
};

export function getMarkdownFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs.readdirSync(CONTENT_DIR).filter((file) => file.toLowerCase().endsWith('.md'));
}

function resolveFileBySlug(slug: string): string | null {
  const files = getMarkdownFiles();
  const direct = `${slug}.md`;

  if (files.includes(direct)) {
    return direct;
  }

  const aliases = fileAliasMap[slug] ?? [];
  for (const alias of aliases) {
    if (files.includes(alias)) {
      return alias;
    }
  }

  const loose = files.find((file) => file.replace(/\.md$/i, '') === slug);
  return loose ?? null;
}

function deriveTitleFromContent(raw: string, fallback: string): string {
  const heading = raw.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback.replace(/_/g, ' ');
}

export function getDocBySlug(slug: string): { meta: DocMeta; content: string } | null {
  const fileName = resolveFileBySlug(slug);
  if (!fileName) {
    return null;
  }

  const fullPath = path.join(CONTENT_DIR, fileName);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);

  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    deriveTitleFromContent(content, fileName.replace(/\.md$/i, ''));

  return {
    meta: {
      slug,
      title,
      description: typeof data.description === 'string' ? data.description : undefined,
      fileName
    },
    content
  };
}

export function getAllDocsMeta(): DocMeta[] {
  const navItems = getAllNavItems();

  const fromNav = navItems
    .map((item) => {
      const doc = getDocBySlug(item.slug);
      if (!doc) {
        return null;
      }
      return { ...doc.meta, title: item.title || doc.meta.title };
    })
    .filter((doc): doc is DocMeta => Boolean(doc));

  const seen = new Set(fromNav.map((doc) => doc.fileName));

  const extra = getMarkdownFiles()
    .filter((file) => !seen.has(file))
    .map((file) => {
      const slug = file.replace(/\.md$/i, '');
      const doc = getDocBySlug(slug);
      return doc?.meta;
    })
    .filter((doc): doc is DocMeta => Boolean(doc));

  return [...fromNav, ...extra];
}
