import { Link } from '@tanstack/react-router';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useEffect, useState } from 'react';

const EXAMPLE_EXPRESSIONS = [
  '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
  '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
  'E = mc^2',
];

export function MathRendererTool() {
  const [input, setInput] = useState(EXAMPLE_EXPRESSIONS[0]);
  const [displayMode, setDisplayMode] = useState(true);
  const [rendered, setRendered] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setRendered('');
      setError(null);
      return;
    }

    try {
      const html = katex.renderToString(input, {
        throwOnError: true,
        displayMode,
      });
      setRendered(html);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to render expression'
      );
      setRendered('');
    }
  }, [input, displayMode]);

  return (
    <div className='space-y-6'>
      <div>
        <Link
          to='/'
          className='text-muted-foreground hover:text-foreground text-sm'
        >
          &larr; Back to tools
        </Link>
      </div>

      <div>
        <h1 className='mb-2 text-2xl font-bold'>Math Renderer</h1>
        <p className='text-muted-foreground'>
          Render LaTeX math expressions using KaTeX. Enter your expression below
          to see it rendered in real-time.
        </p>
      </div>

      <div className='max-w-2xl space-y-4'>
        <div>
          <label className='text-sm font-medium'>LaTeX Expression</label>
          <textarea
            placeholder='Enter LaTeX expression...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className='border-border bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none'
          />
        </div>

        <div className='flex items-center gap-4'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={displayMode}
              onChange={(e) => setDisplayMode(e.target.checked)}
              className='rounded'
            />
            Display mode (block-level)
          </label>
        </div>

        <div className='flex flex-wrap gap-2'>
          <span className='text-muted-foreground text-sm'>Examples:</span>
          {EXAMPLE_EXPRESSIONS.map((expr, i) => (
            <button
              key={i}
              onClick={() => setInput(expr)}
              className='bg-accent hover:bg-accent/80 rounded px-2 py-1 font-mono text-xs'
            >
              {expr.length > 20 ? expr.slice(0, 20) + '...' : expr}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className='border-destructive/50 bg-destructive/10 text-destructive max-w-2xl rounded-lg border p-4'>
          {error}
        </div>
      )}

      {rendered && (
        <div className='border-border bg-card max-w-2xl overflow-hidden rounded-lg border'>
          <div className='border-border bg-accent border-b px-4 py-2'>
            <span className='text-sm font-medium'>Rendered Output</span>
          </div>
          <div
            className='flex min-h-24 items-center justify-center p-6'
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      )}
    </div>
  );
}
