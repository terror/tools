import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { tools } from '@/lib/tools';

export function Home() {
  const [search, setSearch] = useState('');

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Tools</h1>
        <p className="text-muted-foreground">Browse and search through available tools.</p>
      </div>

      <input
        type="text"
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="block p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold mb-1">{tool.name}</h2>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </Link>
        ))}
        {filteredTools.length === 0 && (
          <p className="text-muted-foreground col-span-full">No tools found matching "{search}"</p>
        )}
      </div>
    </div>
  );
}
