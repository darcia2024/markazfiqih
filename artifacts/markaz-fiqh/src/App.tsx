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
import AdminReviewsPage from '@/pages/admin/AdminReviewsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminManageAdminsPage from '@/pages/admin/AdminManageAdminsPage';
import AdminDashboardMessagesPage from '@/pages/admin/AdminDashboardMessagesPage';
import AdminVouchersPage from '@/pages/admin/AdminVouchersPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminCatalogLayoutPage from '@/pages/admin/AdminCatalogLayoutPage';
import AdminBundlesPage from '@/pages/admin/AdminBundlesPage';
import AdminEbooksPage from '@/pages/admin/AdminEbooksPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';
import InstructorsPage from '@/pages/InstructorsPage';
import InstructorDetailPage from '@/pages/InstructorDetailPage';
import BundlesPage from '@/pages/BundlesPage';
import AboutUsPage from '@/pages/AboutUsPage';
import MyEbooksPage from '@/pages/MyEbooksPage';
import EbookDetailPage from '@/pages/EbookDetailPage';

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
      <Route path="/pengajar" component={InstructorsPage} />
      <Route path="/pengajar/:id" component={InstructorDetailPage} />
      <Route path="/learn/:classId" component={LearnPage} />
      <Route path="/ebook-saya" component={MyEbooksPage} />
      <Route path="/ebook/:id" component={EbookDetailPage} />
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
      <Route path="/admin/reviews">
        {() => <RequireAdminRoute><AdminReviewsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <RequireAdminRoute><AdminSettingsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/manage-admins">
        {() => <RequireAdminRoute><AdminManageAdminsPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/dashboard-messages">
        {() => <RequireAdminRoute><AdminDashboardMessagesPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/vouchers">
        {() => <RequireAdminRoute><AdminVouchersPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <RequireAdminRoute><AdminUsersPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/catalog-layout">
        {() => <RequireAdminRoute><AdminCatalogLayoutPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/bundles">
        {() => <RequireAdminRoute><AdminBundlesPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/ebooks">
        {() => <RequireAdminRoute><AdminEbooksPage /></RequireAdminRoute>}
      </Route>
      <Route path="/admin/notifications">
        {() => <RequireAdminRoute><AdminNotificationsPage /></RequireAdminRoute>}
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
