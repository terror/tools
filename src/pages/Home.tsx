import { tools } from '@/lib/tools';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export function Home() {
  const [search, setSearch] = useState('');

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='mb-2 text-2xl font-bold'>Tools</h1>
        <p className='text-muted-foreground'>
          Browse and search through available tools.
        </p>
      </div>

      <input
        type='text'
        placeholder='Search tools...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='border-border bg-background focus:ring-ring w-full max-w-md rounded-md border px-3 py-2 focus:ring-2 focus:outline-none'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {filteredTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className='border-border hover:border-primary hover:bg-accent block rounded-lg border p-4 transition-colors'
          >
            <h2 className='mb-1 font-semibold'>{tool.name}</h2>
            <p className='text-muted-foreground text-sm'>{tool.description}</p>
          </Link>
        ))}
        {filteredTools.length === 0 && (
          <p className='text-muted-foreground col-span-full'>
            No tools found matching "{search}"
          </p>
        )}
      </div>
    </div>
  );
}
