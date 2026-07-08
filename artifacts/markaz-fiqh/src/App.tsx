import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RequireAdminRoute } from '@/components/RequireAdminRoute';

import LoginPage from '@/pages/LoginPage';
import OnboardingNamaPage from '@/pages/OnboardingNamaPage';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import CatalogPage from '@/pages/CatalogPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import MyClassesPage from '@/pages/MyClassesPage';
import CartPage from '@/pages/CartPage';
import LearnPage from '@/pages/LearnPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminClassesPage from '@/pages/admin/AdminClassesPage';
import AdminInstructorsPage from '@/pages/admin/AdminInstructorsPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminManageAdminsPage from '@/pages/admin/AdminManageAdminsPage';
import BundlesPage from '@/pages/BundlesPage';
import AboutUsPage from '@/pages/AboutUsPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/katalog" component={CatalogPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/onboarding-nama" component={OnboardingNamaPage} />
      <Route path="/class/:id" component={ClassDetailPage} />
      <Route path="/my-classes" component={MyClassesPage} />
      <Route path="/tentang-kami" component={AboutUsPage} />
      <Route path="/keranjang" component={CartPage} />
      <Route path="/paket-bundle" component={BundlesPage} />
      <Route path="/learn/:classId" component={LearnPage} />
      <Route path="/admin">
        {() => <RequireAdminRoute><AdminDashboardPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/classes">
        {() => <RequireAdminRoute><AdminClassesPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/instructors">
        {() => <RequireAdminRoute><AdminInstructorsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/orders">
        {() => <RequireAdminRoute><AdminOrdersPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/testimonials">
        {() => <RequireAdminRoute><AdminTestimonialsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <RequireAdminRoute><AdminSettingsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/manage-admins">
        {() => <RequireAdminRoute><AdminManageAdminsPage /></RequireAdminRoute>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <CartProvider>
              <Router />
            </CartProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
