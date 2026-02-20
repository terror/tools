import { Layout } from '@/components/layout';
import { Home } from '@/pages/home';
import { CounterTool } from '@/pages/tools/counter';
import { DiffsTool } from '@/pages/tools/diffs';
import { FlexboxTool } from '@/pages/tools/flexbox';
import { MathTool } from '@/pages/tools/math';
import { OcrTool } from '@/pages/tools/ocr';
import { PasswordTool } from '@/pages/tools/password';
import { PomodoroTool } from '@/pages/tools/pomodoro';
import { ReadabilityTool } from '@/pages/tools/readability';
import { SmugglerTool } from '@/pages/tools/smuggler';
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

const mathRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/math',
  component: MathTool,
});

const pomodoroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/pomodoro',
  component: PomodoroTool,
});

const diffsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/diffs',
  component: DiffsTool,
});

const counterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/counter',
  component: CounterTool,
});

const smugglerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/smuggler',
  component: SmugglerTool,
});

const ocrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/ocr',
  component: OcrTool,
});

const flexboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/flexbox',
  component: FlexboxTool,
});

const passwordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/password',
  component: PasswordTool,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  readabilityRoute,
  mathRoute,
  pomodoroRoute,
  diffsRoute,
  counterRoute,
  smugglerRoute,
  ocrRoute,
  flexboxRoute,
  passwordRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
