import { ModeToggle } from '@/components/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import { Link, Outlet } from '@tanstack/react-router';
import { Hammer } from 'lucide-react';

export function Layout() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <header className='border-border border-b'>
        <div className='container mx-auto flex items-center justify-between px-4 py-3'>
          <Link to='/' className='hover:text-primary text-lg font-semibold'>
            <Hammer className='h-5 w-5' />
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className='container mx-auto px-4 py-6'>
        <Outlet />
      </main>
      <Toaster richColors />
    </div>
  );
}
