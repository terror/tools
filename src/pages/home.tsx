import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersistedState } from '@/hooks';
import { Tool, tools } from '@/lib/tools';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

type SortOption = 'alphabetical' | 'alphabetical-desc' | 'newest' | 'oldest';

function sortTools(toolList: Tool[], sortBy: SortOption): Tool[] {
  return [...toolList].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'alphabetical-desc':
        return b.name.localeCompare(a.name);
      case 'newest':
        return b.createdAt.localeCompare(a.createdAt);
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt);
    }
  });
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className='rounded-sm bg-yellow-200 dark:bg-yellow-800'>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function Home() {
  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] = usePersistedState<SortOption>(
    'tools-sort-preference',
    'newest'
  );

  const filteredTools = sortTools(
    tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
    ),
    sortBy
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='mb-2 text-2xl font-bold'>Tools</h1>
        <p className='text-muted-foreground'>
          Browse and search through available tools.
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <input
          type='text'
          placeholder='Search tools...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='border-border bg-background focus:ring-ring w-full max-w-md rounded-md border px-3 py-2 focus:ring-2 focus:outline-none'
        />
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortOption)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest</SelectItem>
            <SelectItem value='oldest'>Oldest</SelectItem>
            <SelectItem value='alphabetical'>A-Z</SelectItem>
            <SelectItem value='alphabetical-desc'>Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {filteredTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className='hover:border-primary hover:bg-accent block rounded-lg p-4 transition-colors'
          >
            <h2 className='mb-1 font-semibold'>
              <Highlight text={tool.name} query={search} />
            </h2>
            <p className='text-muted-foreground text-sm'>
              <Highlight text={tool.description} query={search} />
            </p>
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
