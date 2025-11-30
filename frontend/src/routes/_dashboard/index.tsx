import { getTitleFromBreadcrumbs } from '@frontend/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import LoadingPage from '@frontend/components/pages/loading';

const AdminDashboard = lazy(
  () => import('./-module/components/pages/admin-dashboard'),
);
const LecturerDashboard = lazy(
  () => import('./-module/components/pages/lecturer-dashboard'),
);
const StudentDashboard = lazy(
  () => import('./-module/components/pages/student-dashboard'),
);

const breadcrumbs = [{ title: 'Dashboard' }];

export const Route = createFileRoute('/_dashboard/')({
  head: () => ({
    meta: [{ title: getTitleFromBreadcrumbs(breadcrumbs) }],
  }),
  beforeLoad: ({ context }) => {
    context.breadcrumbs = breadcrumbs;
  },
  component: RouteComponent,
});

function Dashboard() {
  const role = Route.useRouteContext({ select: (ctx) => ctx.auth.user!.role });

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'student':
      return <StudentDashboard />;
  }
}

function RouteComponent() {
  return (
    <Suspense fallback={<LoadingPage message="Loading Dashboard..." />}>
      <Dashboard />
    </Suspense>
  );
}
