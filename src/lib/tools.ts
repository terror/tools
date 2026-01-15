export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
}

export const tools: Tool[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'A simple hello world tool to get started',
    path: '/tools/hello-world',
  },
];
