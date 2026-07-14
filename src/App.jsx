import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
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
                  <Route path="navigation" element={<Placeholder title="Navigation" />} />
                  <Route path="footer" element={<Placeholder title="Footer" />} />
                  <Route path="pages" element={<Placeholder title="Pages" />} />
                  <Route path="pricing" element={<Placeholder title="Pricing plans" />} />
                  <Route path="payment-gateways" element={<Placeholder title="Payment gateways" />} />
                  <Route path="orders" element={<Placeholder title="Orders" />} />
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
