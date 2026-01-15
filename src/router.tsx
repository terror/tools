import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { ReadabilityTool } from '@/pages/tools/Readability';
import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const readabilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/readability',
  component: ReadabilityTool,
});

const routeTree = rootRoute.addChildren([indexRoute, readabilityRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
