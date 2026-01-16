import { Link } from '@tanstack/react-router';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'markdown-preview-content';

const EXAMPLE_MARKDOWN = `# Hello World

This is a **markdown** preview tool with GitHub Flavored Markdown support.

## Text Formatting

- **Bold** and *italic* text
- ~~Strikethrough~~ text
- [Links](https://example.com) and https://auto.link

## Code

Inline \`code\` and code blocks:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tables

| Feature | Supported |
|---------|-----------|
| Tables | Yes |
| Task lists | Yes |
| Strikethrough | Yes |

## Task List

- [x] Completed task
- [ ] Pending task

> Blockquotes are also supported!
`;

export function MarkdownPreviewTool() {
  const [input, setInput] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved : EXAMPLE_MARKDOWN;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, input);
  }, [input]);

  const rendered = useMemo(() => {
    if (!input.trim()) {
      return '';
    }

    return marked.parse(input, { async: false }) as string;
  }, [input]);

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
        <h1 className='mb-2 text-2xl font-bold'>Markdown Preview</h1>
        <p className='text-muted-foreground'>
          Write markdown on the left and see the rendered output on the right.
        </p>
      </div>
      <div className='grid min-h-[500px] gap-4 lg:grid-cols-2'>
        <div className='flex flex-col'>
          <div className='mb-1 flex items-center justify-between'>
            <label className='text-sm font-medium'>Markdown Input</label>
            {input && (
              <button
                onClick={() => setInput('')}
                className='text-muted-foreground hover:text-foreground text-xs'
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            placeholder='Enter markdown...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='border-border bg-background flex-1 resize-none rounded-md border px-3 py-2 font-mono text-sm focus:outline-none'
          />
        </div>
        <div className='flex flex-col'>
          <label className='mb-1 text-sm font-medium'>Preview</label>
          <div className='border-border bg-card flex-1 overflow-auto rounded-md border p-4'>
            {rendered ? (
              <div
                className='prose prose-neutral dark:prose-invert max-w-none [&>:first-child]:mt-0'
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            ) : (
              <p className='text-muted-foreground italic'>
                Start typing to see preview...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
