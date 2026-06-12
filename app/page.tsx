import { getDocHref, navSections } from '@/lib/navigation';
import { getDocBySlug } from '@/lib/posts';
import { extractDataProductCanvas } from '@/lib/home';
import { CategoryGrid } from '@/components/category-grid';
import { DataProductCanvas } from '@/components/data-product-canvas';
import { HomeHero } from '@/components/home-hero';

export default function HomePage() {
  const resumen = getDocBySlug('Summary');
  const canvas = resumen ? extractDataProductCanvas(resumen.content) : [];

  const categories = navSections.filter((section) => section.title !== 'Referencias');

  return (
    // Layout adaptable: en móvil usa auto y scroll normal; en sm+ usa altura fija con overflow hidden
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-2 sm:h-[calc(100vh-10rem)] sm:overflow-hidden md:px-6 md:py-3">
      <HomeHero />
      <DataProductCanvas canvas={canvas} />
      <CategoryGrid sections={categories} getDocHref={getDocHref} />
    </div>
  );
}