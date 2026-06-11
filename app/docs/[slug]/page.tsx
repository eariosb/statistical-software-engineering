import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { MDXContent } from '@/components/mdx-content';
import { RawHtmlContent } from '@/components/mdx-content';
import { mdxComponents } from '@/components/mdx-content';
import { TableOfContents } from '@/components/table-of-contents';
import { BackToTop } from '@/components/back-to-top';
import { extractToc } from '@/lib/mdx';
import { getAllDocsMeta, getDocBySlug } from '@/lib/posts';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import type { ReactNode } from 'react';

export async function generateStaticParams() {
  return getAllDocsMeta().map((doc) => ({ slug: doc.slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const doc = getDocBySlug(decodedSlug);

  if (!doc) {
    notFound();
    return null;
  }

  const toc = extractToc(doc.content);
  let renderedNode: ReactNode = null;

  try {
    const rendered = await compileMDX({
      source: doc.content,
      components: mdxComponents,
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeHighlight]
        }
      }
    });

    renderedNode = rendered.content;
  } catch {
    const html = marked.parse(doc.content, { gfm: true, breaks: false });
    renderedNode = <RawHtmlContent html={typeof html === 'string' ? html : ''} />;
  }

  return (
    <main className="mx-auto grid w-full max-w-[1300px] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px]">
      <article className="px-6 py-10 md:px-8">
        <Breadcrumbs currentTitle={doc.meta.title} />
        <TableOfContents items={toc} mobileOnly />
        <MDXContent content={renderedNode} />
      </article>
      <div className="hidden xl:block">
        <TableOfContents items={toc} desktopOnly />
      </div>
      <BackToTop />
    </main>
  );
}
