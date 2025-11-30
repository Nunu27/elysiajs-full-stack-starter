import { redirect } from '@tanstack/react-router';
import type { RouterContext } from './router';

export const guestRoute =
  () =>
  ({ context }: { context: RouterContext }) => {
    if (context.auth.user) {
      throw redirect({ to: '/' });
    }
  };

export const protectedRoute =
  () =>
  ({ context }: { context: RouterContext }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' });
    }
  };

export const privateRoute =
  (roles: string[]) =>
  ({ context }: { context: RouterContext }) => {
    if (!roles.includes(context.auth.user?.role ?? '')) {
      throw redirect({ to: '/' });
    }
  };
