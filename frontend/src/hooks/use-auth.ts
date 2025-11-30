import type { Treaty } from '@elysiajs/eden';
import api from '@frontend/lib/api';
import { router } from '@frontend/lib/router';
import { errorHandler } from '@frontend/lib/utils';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LoginData = Parameters<typeof api.auth.login.post>[0];
type AuthUser = Treaty.Data<typeof api.auth.me.get>['data'];

type AuthUtils = {
  login: (_: LoginData) => void;
  logout: () => void;
  ensureData: () => Promise<AuthUser | null>;
};

type AuthData = { user?: AuthUser | null } & AuthUtils;

export const authQueryOptions = queryOptions({
  queryKey: ['me'],
  queryFn: () =>
    api.auth.me.get().then(({ data: response }) => response?.data || null),
  retry: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 30,
});

function useAuth(): AuthData {
  const client = useQueryClient();
  const query = useQuery(authQueryOptions);

  useEffect(() => {
    router.invalidate();
  }, [query.data]);

  const utils: AuthUtils = {
    login: (body) => {
      errorHandler(api.auth.login.post(body), {
        callback: () => {
          client.invalidateQueries({ queryKey: ['me'] });
        },
      });
    },
    logout: () => {
      errorHandler(api.auth.logout.post(), {
        callback: ({ data }) => {
          client.invalidateQueries({ queryKey: ['me'] });

          if (data) {
            window.location.href = data;
          }
        },
      });
    },
    ensureData: async () => {
      const data = await client.ensureQueryData(authQueryOptions);
      if (!data && location.pathname !== '/login') {
        await cookieStore.delete('session');
      }

      return data;
    },
  };

  return { ...utils, user: query.data };
}

export { useAuth };
export type { AuthData, AuthUser };
