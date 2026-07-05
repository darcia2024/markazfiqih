import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';

import LoginPage from '@/pages/LoginPage';
import CatalogPage from '@/pages/CatalogPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import MyClassesPage from '@/pages/MyClassesPage';
import CheckoutPage from '@/pages/CheckoutPage';
import LearnPage from '@/pages/LearnPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={CatalogPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/class/:id" component={ClassDetailPage} />
      <Route path="/my-classes" component={MyClassesPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/learn/:classId" component={LearnPage} />
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
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
