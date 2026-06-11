import navigation from '@/navigation.json';

export type NavItem = {
  title: string;
  slug: string;
  href?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections = navigation as NavSection[];

export function getAllNavItems(): NavItem[] {
  return navSections.flatMap((section) => section.items);
}

export function getDocHref(slug: string): string {
  return `/docs/${encodeURIComponent(slug)}/`;
}

export function normalizeDocsHref(href: string): string {
  return href.endsWith('/') ? href : `${href}/`;
}
