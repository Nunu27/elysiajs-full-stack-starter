import { LoginForm } from '@frontend/components/forms/login-form';
import { guestRoute } from '@frontend/lib/middlewares';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Login - Elysia Full-Stack Starter' }] }),
  beforeLoad: guestRoute(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
