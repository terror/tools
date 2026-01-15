import { useState } from 'react';
import { Link } from '@tanstack/react-router';

export function HelloWorld() {
  const [name, setName] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to tools
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">Hello World</h1>
        <p className="text-muted-foreground">A simple greeting tool.</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="p-4 border border-border rounded-lg bg-accent">
          <p className="text-lg">
            {name ? `Hello, ${name}!` : 'Hello, World!'}
          </p>
        </div>
      </div>
    </div>
  );
}
