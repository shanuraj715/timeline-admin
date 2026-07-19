import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { RequireAuth } from "./components/RequireAuth";
import { RequirePermission } from "./components/RequirePermission";
import { PermissionRevalidator } from "./components/PermissionRevalidator";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Content from "./pages/Content";
import Commerce from "./pages/Commerce";
import Platform from "./pages/Platform";
import Notifications from "./pages/Notifications";
import PageEditor from "./pages/PageEditor";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

// Old flat routes from before pages were grouped into tabs — redirected so
// any bookmark or shared link still lands somewhere useful instead of 404ing.
const LEGACY_REDIRECTS = [
  ["navigation", "/content#navigation"],
  ["footer", "/content#footer"],
  ["pages", "/content#pages"],
  ["themes", "/content#themes"],
  ["pricing", "/commerce#pricing"],
  ["payment-gateways", "/commerce#gateways"],
  ["orders", "/commerce#orders"],
  ["users", "/platform#users"],
  ["timelines", "/platform#timelines"],
  ["security-log", "/platform#security"],
  ["feature-flags", "/platform#flags"],
];

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <PermissionRevalidator />
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
                  <Route index element={<Dashboard />} />
                  <Route path="content" element={<Content />} />
                  <Route path="commerce" element={<Commerce />} />
                  <Route path="platform" element={<Platform />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route
                    path="pages/new"
                    element={
                      <RequirePermission permission="content.pages">
                        <PageEditor />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="pages/:id"
                    element={
                      <RequirePermission permission="content.pages">
                        <PageEditor />
                      </RequirePermission>
                    }
                  />
                  {LEGACY_REDIRECTS.map(([from, to]) => (
                    <Route key={from} path={from} element={<Navigate to={to} replace />} />
                  ))}
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
