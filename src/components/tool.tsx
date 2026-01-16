import { tools } from '@/lib/tools';
import { Link } from '@tanstack/react-router';

interface ToolProps {
  toolId: string;
  error?: string | null;
  children: React.ReactNode;
}

export function Tool({ toolId, error, children }: ToolProps) {
  const tool = tools.find((tool) => tool.id === toolId);

  return (
    <div className='space-y-6'>
      <div>
        <Link
          to='/'
          className='text-muted-foreground hover:text-foreground text-sm'
        >
          &larr; Back to tools
        </Link>
      </div>
      <div>
        <h1 className='mb-2 text-2xl font-bold'>{tool?.name}</h1>
        <p className='text-muted-foreground'>{tool?.description}</p>
      </div>
      {error && (
        <div className='border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-4'>
          {error}
        </div>
      )}
      {children}
    </div>
  );
}
