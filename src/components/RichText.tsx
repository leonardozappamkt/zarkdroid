'use client';

import React from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/** Links like [🔊](audio:https://…) play the file inline; everything else keeps react-markdown's safe defaults. */
function urlTransform(url: string) {
  return url.startsWith('audio:https://') ? url : defaultUrlTransform(url);
}

/**
 * Renders a card's text: Markdown (bold, lists, code, tables), LaTeX math ($x^2$ and $$…$$) and images.
 * Raw HTML is never rendered, so imported or AI-written cards can't inject markup.
 */
export default function RichText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`rich ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={urlTransform}
        components={{
          a: ({ href, children: content }) =>
            href?.startsWith('audio:') ? (
              <audio controls preload="none" src={href.slice('audio:'.length)} className="my-2 h-9 w-full max-w-xs" />
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                {content}
              </a>
            ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="mx-auto my-2 max-h-64 rounded-lg" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
