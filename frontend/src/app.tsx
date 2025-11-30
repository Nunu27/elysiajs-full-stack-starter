import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { Toaster } from '@frontend/components/ui/sonner';
import { useAuth } from '@frontend/hooks/use-auth';
import { useWS } from '@frontend/hooks/use-ws';
import { queryClient } from '@frontend/lib/query';
import { router } from '@frontend/lib/router';
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <RouterProviderWithContext />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RouterProviderWithContext() {
  const auth = useAuth();
  const ws = useWS();

  return (
    <>
      <RouterProvider router={router} context={{ auth, ws }} />
      <Toaster />
    </>
  );
}

export { App };
