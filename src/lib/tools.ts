export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  createdAt: string;
}

export const tools: Tool[] = [
  {
    id: 'readability',
    name: 'Readability',
    description: 'Extract and preview clean article content from any URL.',
    path: '/tools/readability',
    createdAt: '2026-01-15',
  },
  {
    id: 'math-renderer',
    name: 'Math Renderer',
    description: 'Render LaTeX math expressions using KaTeX.',
    path: '/tools/math-renderer',
    createdAt: '2026-01-15',
  },
  {
    id: 'pomodoro-timer',
    name: 'Pomodoro Timer',
    description: 'Stay focused with customizable work and break intervals.',
    path: '/tools/pomodoro-timer',
    createdAt: '2026-01-15',
  },
  {
    id: 'diff-viewer',
    name: 'Diff Viewer',
    description:
      'Render and visualize diffs from pasted patches with customizable display options.',
    path: '/tools/diff-viewer',
    createdAt: '2026-01-15',
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, and analyze text statistics.',
    path: '/tools/word-counter',
    createdAt: '2026-01-16',
  },
  {
    id: 'emoji-smuggler',
    name: 'Emoji Smuggler',
    description:
      'Hide and reveal secret messages in emoji using Unicode variation selectors.',
    path: '/tools/emoji-smuggler',
    createdAt: '2026-01-16',
  },
  {
    id: 'ocr',
    name: 'OCR',
    description:
      'Extract text from PDF documents and images using optical character recognition.',
    path: '/tools/ocr',
    createdAt: '2026-01-16',
  },
  {
    id: 'flexbox-playground',
    name: 'Flexbox Playground',
    description:
      'Experiment with CSS Flexbox properties in real-time using this interactive playground.',
    path: '/tools/flexbox-playground',
    createdAt: '2026-01-17',
  },
];
