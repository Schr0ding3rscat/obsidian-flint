import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';

import { ShellLayout } from '../shell/shell-layout';
import { LoadingScreen } from '../ui/loading-screen';

const rootRoute = createRootRoute({
  component: () => <ShellLayout />
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const Dashboard = lazy(() => import('../views/dashboard-view'));
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Dashboard />
      </Suspense>
    );
  }
});

const commandPaletteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/command-palette',
  component: () => {
    const CommandPalette = lazy(() => import('../views/command-palette-view'));
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CommandPalette />
      </Suspense>
    );
  }
});

const routeTree = rootRoute.addChildren([dashboardRoute, commandPaletteRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
