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
];
