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
    id: 'pomodoro-timer',
    name: 'Pomodoro Timer',
    description: 'Stay focused with customizable work and break intervals',
    path: '/tools/pomodoro-timer',
  },
  {
    id: 'diff-viewer',
    name: 'Diff Viewer',
    description:
      'Render and visualize diffs from pasted patches with customizable display options',
    path: '/tools/diff-viewer',
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words and analyze text statistics',
    path: '/tools/word-counter',
  },
  {
    id: 'emoji-smuggler',
    name: 'Emoji Smuggler',
    description:
      'Hide and reveal secret messages in emoji using Unicode variation selectors',
    path: '/tools/emoji-smuggler',
  },
];
