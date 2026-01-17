import { Layout } from '@/components/layout';
import { Home } from '@/pages/home';
import { DiffViewerTool } from '@/pages/tools/diff-viewer';
import { EmojiSmugglerTool } from '@/pages/tools/emoji-smuggler';
import { FlexboxPlaygroundTool } from '@/pages/tools/flexbox-playground';
import { MathRendererTool } from '@/pages/tools/math-renderer';
import { OcrTool } from '@/pages/tools/ocr';
import { PomodoroTimerTool } from '@/pages/tools/pomodoro-timer';
import { ReadabilityTool } from '@/pages/tools/readability';
import { WordCounterTool } from '@/pages/tools/word-counter';
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

const pomodoroTimerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/pomodoro-timer',
  component: PomodoroTimerTool,
});

const diffViewerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/diff-viewer',
  component: DiffViewerTool,
});

const wordCounterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/word-counter',
  component: WordCounterTool,
});

const emojiSmugglerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/emoji-smuggler',
  component: EmojiSmugglerTool,
});

const ocrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/ocr',
  component: OcrTool,
});

const flexboxPlaygroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/flexbox-playground',
  component: FlexboxPlaygroundTool,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  readabilityRoute,
  mathRendererRoute,
  pomodoroTimerRoute,
  diffViewerRoute,
  wordCounterRoute,
  emojiSmugglerRoute,
  ocrRoute,
  flexboxPlaygroundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
