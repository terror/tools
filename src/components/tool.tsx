import { tools } from '@/lib/tools';
import { Link } from '@tanstack/react-router';

interface ToolProps {
  toolId: string;
  children: React.ReactNode;
}

export function Tool({ toolId, children }: ToolProps) {
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
      {children}
    </div>
  );
}
