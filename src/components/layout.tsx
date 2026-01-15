import { Link, Outlet } from '@tanstack/react-router';

export function Layout() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <header className='border-border border-b'>
        <div className='container mx-auto px-4 py-3'>
          <Link to='/' className='hover:text-primary text-lg font-semibold'>
            🔨
          </Link>
        </div>
      </header>
      <main className='container mx-auto px-4 py-6'>
        <Outlet />
      </main>
    </div>
  );
}
