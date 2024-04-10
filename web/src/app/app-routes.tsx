import { lazy } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { UiLayout } from './ui/ui-layout';

const DashboardFeature = lazy(() => import('./dashboard/dashboard-feature'));

export function AppRoutes() {
  return (
    <UiLayout links={[]}>
      {useRoutes([
        { index: true, element: <Navigate to={'/dashboard'} replace={true} /> },
        { path: '/dashboard', element: <DashboardFeature /> },
        { path: '*', element: <Navigate to={'/dashboard'} replace={true} /> },
      ])}
    </UiLayout>
  );
}
