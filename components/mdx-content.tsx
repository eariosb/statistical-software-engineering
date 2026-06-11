import Link from 'next/link';
import { MermaidBlock } from '@/components/mermaid-block';
import { CollapsibleCodeBlock } from '@/components/collapsible-code-block';
import { normalizeDocsHref } from '@/lib/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MdxContentProps = {
  content: ReactNode;
};

export function MDXContent({ content }: MdxContentProps) {
  return <div className="prose-doc w-full">{content}</div>;
}

export function RawHtmlContent({ html }: { html: string }) {
  return <div className="prose-doc w-full" dangerouslySetInnerHTML={{ __html: html }} />;
}

export const mdxComponents = {
  a: ({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.endsWith('.md')) {
      const slug = href.split('/').pop()?.replace(/\.md$/i, '');
      if (slug) {
        return <Link href={normalizeDocsHref(`/docs/${encodeURIComponent(slug)}`)} {...props} />;
      }
    }

    if (href.startsWith('/docs/')) {
      return <Link href={normalizeDocsHref(href)} {...props} />;
    }

    return <a href={href} {...props} />;
  },
  pre: ({ children }: { children?: ReactNode }) => {
    const codeChild =
      typeof children === 'object' &&
      children !== null &&
      'props' in (children as object)
        ? (children as { props?: { className?: string; children?: string } })
        : null;

    const className = codeChild?.props?.className ?? '';
    const raw = typeof codeChild?.props?.children === 'string' ? codeChild.props.children : '';

    if (className.includes('language-mermaid')) {
      return <MermaidBlock chart={raw} />;
    }

    const langMatch = className.match(/language-(\w+)/);
    const language = langMatch ? langMatch[1] : '';

    return (
      <CollapsibleCodeBlock language={language} code={raw}>
        {children}
      </CollapsibleCodeBlock>
    );
  }
};
