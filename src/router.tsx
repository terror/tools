import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { HelloWorld } from '@/pages/tools/HelloWorld';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const helloWorldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/hello-world',
  component: HelloWorld,
});

const routeTree = rootRoute.addChildren([indexRoute, helloWorldRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
