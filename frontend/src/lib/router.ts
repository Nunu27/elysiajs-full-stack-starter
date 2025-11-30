import { createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { queryClient } from '@frontend/lib/query';
import { routeTree } from '@frontend/routeTree.gen';
import type { AuthData } from '@frontend/hooks/use-auth';
import type { useWS } from '@frontend/hooks/use-ws';

type BreadcrumbItem = {
  title: string;
  url?: string;
};

type RouterContext = {
  auth: AuthData;
  queryClient: QueryClient;
  breadcrumbs: BreadcrumbItem[];
  ws: ReturnType<typeof useWS>;
};

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient,
    breadcrumbs: [],
    auth: null as unknown as AuthData,
    ws: null as unknown as ReturnType<typeof useWS>,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };
export type { RouterContext };
