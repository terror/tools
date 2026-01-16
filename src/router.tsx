import { Layout } from '@/components/layout';
import { Home } from '@/pages/home';
import { MathRendererTool } from '@/pages/tools/math-renderer';
import { ReadabilityTool } from '@/pages/tools/readability';
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

const mathRendererRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/math-renderer',
  component: MathRendererTool,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  readabilityRoute,
  mathRendererRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
