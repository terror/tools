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
    id: 'math',
    name: 'Math',
    description: 'Render LaTeX math expressions using KaTeX.',
    path: '/tools/math',
    createdAt: '2026-01-15',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    description: 'Stay focused with customizable work and break intervals.',
    path: '/tools/pomodoro',
    createdAt: '2026-01-15',
  },
  {
    id: 'diffs',
    name: 'Diffs',
    description:
      'Render and visualize diffs from pasted patches with customizable display options.',
    path: '/tools/diffs',
    createdAt: '2026-01-15',
  },
  {
    id: 'counter',
    name: 'Counter',
    description: 'Count words, characters, and analyze text statistics.',
    path: '/tools/counter',
    createdAt: '2026-01-16',
  },
  {
    id: 'smuggler',
    name: 'Smuggler',
    description:
      'Hide and reveal secret messages in emoji using Unicode variation selectors.',
    path: '/tools/smuggler',
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
    id: 'flexbox',
    name: 'Flexbox',
    description:
      'Experiment with CSS Flexbox properties in real-time using this interactive playground.',
    path: '/tools/flexbox',
    createdAt: '2026-01-17',
  },
  {
    id: 'password',
    name: 'Password Generator',
    description:
      'Generate strong, random passwords with customizable length and character options.',
    path: '/tools/password',
    createdAt: '2026-02-19',
  },
];
