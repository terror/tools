export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
}

export const tools: Tool[] = [
  {
    id: 'readability',
    name: 'Readability',
    description: 'Extract and preview clean article content from any URL',
    path: '/tools/readability',
  },
  {
    id: 'math-renderer',
    name: 'Math Renderer',
    description: 'Render LaTeX math expressions using KaTeX',
    path: '/tools/math-renderer',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Preview markdown with live rendering',
    path: '/tools/markdown-preview',
  },
];
