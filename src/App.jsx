import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Navigation from "./pages/Navigation";
import Footer from "./pages/Footer";
import PagesList from "./pages/PagesList";
import PageEditor from "./pages/PageEditor";
import Pricing from "./pages/Pricing";
import PaymentGateways from "./pages/PaymentGateways";
import Orders from "./pages/Orders";
import { Placeholder } from "./pages/Placeholder";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Placeholder title="Dashboard" />} />
                  <Route path="navigation" element={<Navigation />} />
                  <Route path="footer" element={<Footer />} />
                  <Route path="pages" element={<PagesList />} />
                  <Route path="pages/new" element={<PageEditor />} />
                  <Route path="pages/:id" element={<PageEditor />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="payment-gateways" element={<PaymentGateways />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="feature-flags" element={<Placeholder title="Feature flags" />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
