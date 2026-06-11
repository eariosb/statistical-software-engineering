import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const NAV_PATH = path.join(ROOT_DIR, 'navigation.json');

const fileAliasMap = {
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

function getMarkdownFiles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((file) => file.toLowerCase().endsWith('.md'));
}

function resolveFileBySlug(slug) {
  const files = getMarkdownFiles();
  const direct = `${slug}.md`;
  if (files.includes(direct)) return direct;
  const aliases = fileAliasMap[slug] ?? [];
  for (const alias of aliases) {
    if (files.includes(alias)) return alias;
  }
  return files.find((file) => file.replace(/\.md$/i, '') === slug) || null;
}

function deriveTitleFromContent(raw, fallback) {
  const match = raw.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback.replace(/_/g, ' ');
}

function stripCodeBlocks(input) {
  return input.replace(/```[\s\S]*?```/g, ' ');
}

function stripMarkdown(input) {
  return input
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_~|\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDocBySlug(slug) {
  const fileName = resolveFileBySlug(slug);
  if (!fileName) return null;
  const fullPath = path.join(CONTENT_DIR, fileName);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);
  const title = (typeof data.title === 'string' && data.title.trim()) || deriveTitleFromContent(content, fileName.replace(/\.md$/i, ''));
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

function getAllNavItems() {
  if (!fs.existsSync(NAV_PATH)) return [];
  const nav = JSON.parse(fs.readFileSync(NAV_PATH, 'utf8'));
  return nav.flatMap((section) => (section.items ?? []).map((item) => item));
}

function getAllDocsMeta() {
  const navItems = getAllNavItems();
  const fromNav = navItems
    .map((item) => {
      const doc = getDocBySlug(item.slug);
      if (!doc) return null;
      return { ...doc.meta, title: item.title || doc.meta.title };
    })
    .filter(Boolean);
  const seen = new Set(fromNav.map((doc) => doc.fileName));
  const extra = getMarkdownFiles()
    .filter((file) => !seen.has(file))
    .map((file) => {
      const slug = file.replace(/\.md$/i, '');
      const doc = getDocBySlug(slug);
      return doc?.meta;
    })
    .filter(Boolean);
  return [...fromNav, ...extra];
}

function buildSearchDocs() {
  return getAllDocsMeta().map((meta) => {
    const doc = getDocBySlug(meta.slug);
    return {
      id: meta.slug,
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      body: stripMarkdown(stripCodeBlocks(doc.content))
    };
  });
}

function writeSearchData(outDir = PUBLIC_DIR) {
  const docs = buildSearchDocs();
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify(docs), 'utf8');
}

writeSearchData();
console.log('search-index.json generated successfully.');
