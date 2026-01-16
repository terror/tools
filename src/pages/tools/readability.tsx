import { Tool } from '@/components/tool';
import { Readability } from '@mozilla/readability';
import { useState } from 'react';
import { toast } from 'sonner';

interface Article {
  title: string;
  byline: string | null;
  content: string;
  excerpt: string | null;
  siteName: string | null;
}

export function ReadabilityTool() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchArticle() {
    if (!url) return;

    setLoading(true);
    setArticle(null);

    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const base = doc.createElement('base');
      base.href = url;
      doc.head.appendChild(base);

      const reader = new Readability(doc);
      const parsed = reader.parse();

      if (!parsed || !parsed.content) {
        throw new Error('Could not parse article content');
      }

      setArticle({
        title: parsed.title ?? 'Untitled',
        byline: parsed.byline ?? null,
        content: parsed.content,
        excerpt: parsed.excerpt ?? null,
        siteName: parsed.siteName ?? null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tool toolId='readability'>
      <div className='flex max-w-2xl gap-2'>
        <input
          type='url'
          placeholder='https://example.com/article'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchArticle()}
          className='border-border bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 focus:ring-2 focus:outline-none'
        />
        <button
          onClick={fetchArticle}
          disabled={loading || !url}
          className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Extract'}
        </button>
      </div>

      {article && (
        <article className='border-border max-w-2xl overflow-hidden rounded-lg border'>
          <header className='border-border bg-accent border-b p-6'>
            <h2 className='mb-2 text-xl font-bold'>{article.title}</h2>
            {(article.byline || article.siteName) && (
              <p className='text-muted-foreground text-sm'>
                {article.byline}
                {article.byline && article.siteName && ' · '}
                {article.siteName}
              </p>
            )}
            {article.excerpt && (
              <p className='text-muted-foreground mt-3 italic'>
                {article.excerpt}
              </p>
            )}
          </header>
          <div
            className='prose prose-neutral dark:prose-invert max-w-none p-6'
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      )}
    </Tool>
  );
}
