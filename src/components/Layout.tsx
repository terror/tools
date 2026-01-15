import { Link, Outlet } from '@tanstack/react-router';

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Link to="/" className="text-lg font-semibold hover:text-primary">
            🔨
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
