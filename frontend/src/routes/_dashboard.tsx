import ThemeToggle from '@frontend/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@frontend/components/ui/breadcrumb';
import { Separator } from '@frontend/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@frontend/components/ui/sidebar';
import { protectedRoute } from '@frontend/lib/middlewares';
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { Fragment } from 'react';
import { AppSidebar } from './_dashboard/-module/components/app-sidebar';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: protectedRoute(),
  component: RouteComponent,
});

function RouteComponent() {
  const breadcrumbs = useRouterState({
    select: (state) =>
      state.matches[state.matches.length - 1]?.context.breadcrumbs || [],
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 justify-between px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <Fragment key={index}>
                    {index > 0 && (
                      <BreadcrumbSeparator
                        key={`sep-${index}`}
                        className="hidden md:block"
                      />
                    )}
                    <BreadcrumbItem
                      key={index}
                      className={index === 0 ? 'hidden md:block' : ''}
                    >
                      {breadcrumb.url ? (
                        <BreadcrumbLink href={breadcrumb.url}>
                          {breadcrumb.title}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 px-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
