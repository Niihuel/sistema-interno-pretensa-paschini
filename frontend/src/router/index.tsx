import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Layout from '../shared/components/layout/Layout'
import LoadingSpinner from '../shared/components/ui/LoadingSpinner'

// Lazy load pages
import { lazy, Suspense } from 'react'

const HomePage = lazy(() => import('../pages/HomePage'))
const LoginPage = lazy(() => import('../features/auth/components/LoginPage'))
const DashboardPage = lazy(() => import('../features/dashboard/components/DashboardPage'))
const EmployeesPage = lazy(() => import('../features/employees/components/EmployeesPage'))
const EmployeeDetailPage = lazy(() => import('../features/employees/components/EmployeeDetailPage'))
const EquipmentPage = lazy(() => import('../features/equipment/components/EquipmentPage'))
const TicketsPage = lazy(() => import('../features/tickets/components/TicketsPage'))
const PrintersPage = lazy(() => import('../features/printers/components/PrintersPage'))
const PurchaseRequestsPage = lazy(() => import('../features/purchase-requests/components/PurchaseRequestsPage'))
const InventoryPage = lazy(() => import('../features/inventory/components/InventoryPage'))
const AdminPage = lazy(() => import('../features/admin/components/AdminPage'))
const AreasPage = lazy(() => import('../features/areas/components/AreasPage'))
const ZonesPage = lazy(() => import('../features/zones/components/ZonesPage'))
const BackupsPage = lazy(() => import('../features/backups/components/BackupsPage'))
const DailyBackupsPage = lazy(() => import('../features/daily-backups/components/DailyBackupsPage'))
const CalendarPage = lazy(() => import('../features/calendar/pages/CalendarPage'))
const PurchasesPage = lazy(() => import('../features/purchases/components/PurchasesPage'))
const ReplacementsPage = lazy(() => import('../features/replacements/components/ReplacementsPage'))
const LockedAccountsPage = lazy(() => import('../features/users/components/LockedAccountsPage'))
const NotFoundPage = lazy(() => import('../shared/components/error/NotFoundPage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

const LoadingFallback = () => <LoadingSpinner fullScreen />

const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense>
  },
  {
    path: '/login',
    element: <Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>
  },
  {
    path: '/dashboard',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense></PrivateRoute>
  },
  {
    path: '/employees',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><EmployeesPage /></Suspense></PrivateRoute>
  },
  {
    path: '/employees/:id',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><EmployeeDetailPage /></Suspense></PrivateRoute>
  },
  {
    path: '/equipment',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><EquipmentPage /></Suspense></PrivateRoute>
  },
  {
    path: '/tickets',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><TicketsPage /></Suspense></PrivateRoute>
  },
  {
    path: '/printers',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><PrintersPage /></Suspense></PrivateRoute>
  },
  {
    path: '/purchase-requests',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><PurchaseRequestsPage /></Suspense></PrivateRoute>
  },
  {
    path: '/inventory',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense></PrivateRoute>
  },
  {
    path: '/admin',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><AdminPage /></Suspense></PrivateRoute>
  },
  {
    path: '/admin/locked-accounts',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><LockedAccountsPage /></Suspense></PrivateRoute>
  },
  {
    path: '/areas',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><AreasPage /></Suspense></PrivateRoute>
  },
  {
    path: '/zones',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><ZonesPage /></Suspense></PrivateRoute>
  },
  {
    path: '/backups',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><BackupsPage /></Suspense></PrivateRoute>
  },
  {
    path: '/daily-backups',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><DailyBackupsPage /></Suspense></PrivateRoute>
  },
  {
    path: '/calendar',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><CalendarPage /></Suspense></PrivateRoute>
  },
  {
    path: '/purchases',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><PurchasesPage /></Suspense></PrivateRoute>
  },
  {
    path: '/replacements',
    element: <PrivateRoute><Suspense fallback={<LoadingFallback />}><ReplacementsPage /></Suspense></PrivateRoute>
  },
  {
    path: '*',
    element: <Suspense fallback={<LoadingFallback />}><NotFoundPage /></Suspense>
  }
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
