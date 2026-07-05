import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import CatalogPage from '@/pages/CatalogPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import MyClassesPage from '@/pages/MyClassesPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentPage from '@/pages/PaymentPage';
import PaymentStatusPage from '@/pages/PaymentStatusPage';
import LearnPage from '@/pages/LearnPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminClassesPage from '@/pages/admin/AdminClassesPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/katalog" component={CatalogPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/class/:id" component={ClassDetailPage} />
      <Route path="/my-classes" component={MyClassesPage} />
      <Route path="/keranjang" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/payment-status" component={PaymentStatusPage} />
      <Route path="/learn/:classId" component={LearnPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/classes" component={AdminClassesPage} />
      <Route path="/admin/orders" component={AdminOrdersPage} />
      <Route path="/admin/testimonials" component={AdminTestimonialsPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />
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
